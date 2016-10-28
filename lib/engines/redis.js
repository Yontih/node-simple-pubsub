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

        for (let e of this.events) {
            this.subscribe(e);
        }
    }

    publish(msg) {
        let msgAsJson = JSON.stringify(msg);
        for (let e of this.events) {
            this.publisher.publish(e, msgAsJson);
        }
    }

    subscribe(event) {
        this.subscriber.subscribe(event);
    }
}

module.exports = Redis;