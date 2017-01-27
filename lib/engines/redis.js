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

        this._init();
    }

    _init() {
        this.subscriber.on("message", (channel, msg) => {
            let parsedMsg = safeJson.parse(msg);
            this.emit('message', parsedMsg);
        });

        for (let topic of this.topics) {
            this.subscribe(topic);
        }
    }

    publish(msg) {
        let msgAsJson = JSON.stringify(msg);
        return Promise.each(this.topics, (topic) => {
            return this.internalPublish(topic, msgAsJson);
        });
    }

    subscribe(event) {
        this.subscriber.subscribe(event);
    }

    internalPublish(topic, msg) {
        return new Promise((resolve, reject) => {
            this.publisher.publish(topic, msg, (err) => {
                if (err) {
                    return reject(err);
                }

                return resolve();
            });
        });
    }
}

module.exports = Redis;
