'use strict';

const redis = require('redis');
const Promise = require('bluebird');

const Engine = require('./Engine');
const safeJson = require('../utils/safeJson');

class Redis extends Engine {
    constructor(options) {
        super(options);
        this.publisher = redis.createClient(options);
        this.subscriber = redis.createClient(options);
    }

    init() {
        this.subscriber.on("message", (channel, msg) => {
            let parsedMsg = safeJson.parse(msg);
            this.emit('message', parsedMsg);
        });

        return Promise.resolve(this);
    }

    publish(topic, msg) {
        return new Promise((resolve, reject) => {
            let msgAsJson = JSON.stringify(msg);
            return this.publisher.publish(topic, msgAsJson, (err, res) => {
                return err ? reject(err) : resolve(res);
            });
        });
    }

    subscribe(topic) {
        return new Promise((resolve, reject) => {
            this.subscriber.subscribe(topic, (err, topic) => {
                return err ? reject(err) : resolve(topic);
            });
        });
    }
}

module.exports = Redis;
