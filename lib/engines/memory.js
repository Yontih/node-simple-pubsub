'use strict';

const Engine = require('./Engine');

class Memory extends Engine {
    constructor(options) {
        super(options);
    }

    init() {
        return Promise.resolve(this);
    }

    publish(topic, msg) {
        this.emit(topic, msg);
    }

    subscribe(topic) {
        this.on(topic, (msg) => {
            this.emit('message', msg);
        });
    }
}

module.exports = Memory;