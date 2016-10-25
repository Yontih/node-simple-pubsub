'use strict';

const _ = require('lodash');
const Promise = require('bluebird');

const Sqs = require('./engines/sqs');

class PubSub {
    /**
     * @param options:
     * @param options.url: sqs queue url
     * @param options.region: aws region
     */
    constructor(options) {
        let url = options.url;
        let region = options.region;

        options = _.omit(options, ['url', 'region', 'logger']);
        options = Object.assign({
            url: url,
            json: true,
            aws: {region: region}
        }, options);

        this.pubsub = new Sqs(options);
        this.workers = {};

        this.pubsub.on('message', this._onMessages.bind(this));
        this.pubsub.listen();
    }

    publish(message) {
        if (message.type && message.action) {
            return this.pubsub.push({
                body: message
            });
        }

        return Promise.reject('Message is not valid');
    }

    subscribe(event, handler) {
        if (!this.workers.hasOwnProperty(event)) {
            this.workers[event] = [];
        }

        this.workers[event].push(handler);
    }

    _onMessages(data) {
        this.logger.trace(`pulled ${data.length} message(s)`);
        let actions = [];

        for (let msg of data) {
            actions.push(this._proccessMsg(msg));
            actions.push(this.pubsub.deleteMessage(msg.ref));
        }

        return Promise.all(actions)
            .catch((err) => {
                this.logger.error(err);
            });
    }

    _proccessMsg(msg) {
        this.logger.trace(`Processing new msg: ${JSON.stringify(msg.body)}`);
        let body = msg.body;
        if (body.type && body.action) {
            let event = `${body.type}:${body.action}`;
            let workers = this.workers[event];

            if (_.isArray(workers)) {
                let actions = [];

                for (let worker of workers) {
                    actions.push(worker.handler(body));
                }

                return Promise.all(actions);
            }

            return Promise.resolve();
        }
    }
}

module.exports = PubSub;