'use strict';

const EventEmitter = require('events');

class Engine extends EventEmitter {
    constructor(options) {
        super();
        delete options.event;
    }

    init(cb) {
        cb(new Error('Not implemented'));
    }

    publish(topic, msg) {
        throw new Error('Not implemented');
    }

    subscribe(topic) {
        throw new Error('Not implemented');
    }
}

module.exports = Engine;