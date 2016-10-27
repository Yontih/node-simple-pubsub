'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const AWS = require('aws-sdk');
const uuid = require('uuid');

const Engine = require('./Engine');
const validateProperties = require('../utils/validateProperties');
const safeJson = require('../utils/safeJson');

AWS.config.setPromisesDependency(Promise);

const ALLOWED_ATTRIBUTE_TYPES = ['String', 'Number', 'Binary'];

class Sqs extends Engine {
    /**
     *
     * @param options.url: sqs url
     * @param options.json: convert message body to json object
     * @param options.messageWaitTime: The duration (in seconds) for which the call will wait for a message to arrive in the queue before returning.
     * @param options.maxMessagesCount: The maximum number of messages to return
     * @param options.aws: aws configuration
     */
    constructor(options) {
        super();

        validateProperties({
            object: options,
            params: ['url'],
            shouldThrow: true
        });

        this.defaultParams = {
            QueueUrl: options.url
        };

        let aws = Object.assign(
            {apiVersion: '2012-11-05'},
            _.get(options, 'aws', {})
        );
        this.instance = new AWS.SQS(aws);

        Object.assign(this, {
            json: true,
            messageWaitTime: 20,
            maxMessagesCount: 1
        }, options);

        this.listen();
    }

    /**
     * polling
     * @param options.messageWaitTime: The duration (in seconds) for which the call will wait for a message to arrive in the queue before returning.
     * @param options.maxMessagesCount: The maximum number of messages to return
     */
    listen(options) {
        return this.pull(options)
            .then((data) => {
                if (data.length) {
                    this.emit('message', data);
                }
            })
            .catch((err) => {
                this.emit('error', err);
            })
            .finally(() => {
                process.nextTick(() => this.listen());
            });
    }

    /**
     * @param value: value to queue, String/Object, object example: {body: String/Object, topic: {name, value}}
     * @param options:
     * @param options.QueueUrl
     * @param options.DelaySeconds
     */
    publish(event, value, options) {
        let data = this._prepareDataToQueue(value);

        let params = Object.assign(data, this.defaultParams, options);
        return this.instance.sendMessage(params).promise();
    }

    /**
     * @param values: array of values to queue (string or object {body: String/Object, topic: {name, value}}
     * @param options:
     * @param options.QueueUrl
     * @param options.DelaySeconds
     */
    publishMany(values, options) {
        if (!_.isArray(values)) {
            throw new Error('values must be an array');
        }

        let data = _.map(values, (item) => {
            let value = this._prepareDataToQueue(item);
            return Object.assign({Id: uuid.v4()}, value);
        });

        let params = Object.assign({Entries: data}, this.defaultParams, options);
        return this.instance.sendMessageBatch(params).promise();
    }

    /**
     * @param attributes: message attributes to receive  (String/Array)
     * @param options.messageWaitTime: The duration (in seconds) for which the call will wait for a message to arrive in the queue before returning.
     * @param options.maxMessagesCount: The maximum number of messages to return
     * @returns array of {mid: messsage id, etag: encoded body (MD5), body: message body, ref: message delete id (use this to delete message }
     */
    pull(options) {
        let params = Object.assign({
                WaitTimeSeconds: _.get(options, 'messageWaitTime', this.messageWaitTime),
                MaxNumberOfMessages: _.get(options, 'maxMessagesCount', this.maxMessagesCount),
                MessageAttributeNames: ['*']
            }
            , this.defaultParams);

        return this.instance.receiveMessage(params).promise()
            .then((result) => {
                return _.map(result.Messages, (msg) => {
                    let attributes = _.reduce(msg.MessageAttributes, (result, a, name) => {
                        let dataType = a.DataType;
                        let valueKey = `${dataType}Value`;
                        result[name] = a[valueKey];
                        return result;
                    }, {});

                    let convertBodyToJson = !!attributes.json || this.json;

                    return {
                        id: msg.MessageId,
                        etag: msg.MD5OfBody,
                        body: convertBodyToJson ? safeJson.parse(msg.Body) : msg.Body,
                        ref: msg.ReceiptHandle,
                        attributes
                    }
                });
            });
    }

    /**
     * @param ref: message delete id (String)
     * @param options:
     * @param options.QueueUrl
     * @param options.DelaySeconds
     */
    delete(ref, options) {
        let params = Object.assign({ReceiptHandle: ref}, this.defaultParams, options);
        return this.instance.deleteMessage(params).promise();
    }

    /**
     * Delete all the messages in the queue
     */
    purge() {
        return this.instance.purgeQueue(this.defaultParams).promise();
    }

    /**
     * @private
     */
    _prepareDataToQueue(data) {
        let result = {};
        let attributes = {};
        let body;

        if (typeof data === 'object') {
            body = data.body;
            if (typeof data.body === "object") {
                body = JSON.stringify(data.body);
            } else {
                body = data.body.toString();
            }
        } else {
            body = data.toString()
        }

        // set custom topics
        let attr = _.get(data, 'attributes');
        if (attr) {
            delete data.attributes;
            attributes = this._prepareAttributes(attr);
        }

        // set default topics
        attributes['timestamp'] = this._prepareAttribute('timestamp', new Date().toISOString());
        if (this.json) {
            attributes['json'] = this._prepareAttribute('json', 'true');
        }

        _.set(result, 'MessageBody', body);
        _.set(result, 'MessageAttributes', attributes);

        return result;
    }

    /**
     * @param attributes: list of attributes
     * @private
     */
    _prepareAttributes(attributes) {
        return _.reduce(attributes, (result, value, key) => {
            result[key] = this._prepareAttribute(key, value);
            return result;
        }, {});
    }

    /**
     * Amazon SQS supports the following logical data types: String, Number, and Binary.
     * For the Number data type, you must use StringValue.
     * @param name: attribute name
     * @param value: attribute value
     * @private
     */
    _prepareAttribute(name, value) {
        value = value === 0 || value === false ? value : value || name;
        let type = _.capitalize(typeof value);

        if (ALLOWED_ATTRIBUTE_TYPES.indexOf(type) === -1) {
            throw new Error(`Unsupported attribute type: ${type}`);
        }

        // for Number data type, you must use StringValue.
        if (type === 'Number') {
            type = 'String';
            value = value.toString();
        }

        return Object.assign({DataType: type}, _.set({}, `${type}Value`, value));
    }
}

module.exports = Sqs;