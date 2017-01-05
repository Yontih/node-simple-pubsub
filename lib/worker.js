'use strict';
const _ = require('lodash');
const Promise = require('bluebird');

class Worker {
    constructor(options) {
        this.events = this._parseEvents(options.event || options.events);
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
            for (let event of this.events) {
                s.subscribe(event, this);
            }
        }
    }

    _parseEvents(values) {
        let events = _.isArray(values) ? values : [values]

        return events.map((e) => {
            let event = true;
            if (typeof e === 'object') {
                event = this._prepareEventObj(e);
            } else if (typeof e === 'string') {
                event = this._prepareEventString(e);
            }

            if (!event) {
                throw new Error(`${e} is not a valid event`);
            }

            return event;
        })
    }

    _prepareEventObj(o) {
        return o.hasOwnProperty('type') && o.hasOwnProperty('action') ?
            `${o.type}:${o.action}` : false;
    }

    _prepareEventString(s) {
        return s.indexOf(':') > -1 ? s : false;
    }
}

module.exports = Worker;