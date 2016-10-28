'use strict';

const _ = require('lodash');
const EventEmitter = require('events');

class Engine extends EventEmitter {
    constructor(options) {
        super();

        this.events = _.isArray(options.event) ? options.event : [options.event];
        delete options.event;
    }

    publish() {
    }

    subscribe() {

    }
}

module.exports = Engine;