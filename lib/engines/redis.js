'use strict';

const redis = require('redis');
const _ = require('lodash');

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
        for (let topic of this.topics) {
            this.publisher.publish(topic, msgAsJson);
        }
    }

    subscribe(event) {
        this.subscriber.subscribe(event);
    }
}

module.exports = Redis;