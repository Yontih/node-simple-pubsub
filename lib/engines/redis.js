'use strict';

const redis = require('redis');

const Engine = require('./Engine');
const safeJson = require('../utils/safeJson');

class Redis extends Engine {
    constructor(options) {
        super();

        this.pub = redis.createClient(options);
        this.sub = redis.createClient(options);

        this.listen();
    }

    listen() {
        this.sub.on("message", (channel, message) => {
            let body = safeJson.parse(message);
            this.emit('message', [{
                id: '',
                body: body,
                ref: '',
                etag: ''
            }]);
        });
    }

    publish(event, message) {
        return this.pub.publish(event, JSON.stringify(message));
    }

    subscribe(event) {
        this.sub.subscribe(event);
    }
}

module.exports = Redis;