'use strict';

const Promise = require('bluebird');

class Worker {
    constructor(options) {
        this.event = options.event;
        this.subscribers = options.subscribers;
        this.publishers = options.publishers;
        this.handler = options.handler;

        if (!this.subscribers) {
            throw new Error('Cannot initialize worker without subscribers');
        }
    }

    publish(message) {
        return Promise.map(this.publishers, (publisher) => publisher.publish(message));
    }

    subscribe() {
        for (let s of this.subscribers) {
            s.subscribe(this.event, this);
        }
    }
}

module.exports = Worker;