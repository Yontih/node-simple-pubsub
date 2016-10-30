'use strict';

const _ = require('lodash');
const EventEmitter = require('events');

class Engine extends EventEmitter {
    constructor(options) {
        super();

        this.topics = _.isArray(options.topic) ? options.topic : [options.topic];
        delete options.event;
    }

    publish() {
    }

    subscribe() {

    }
}

module.exports = Engine;