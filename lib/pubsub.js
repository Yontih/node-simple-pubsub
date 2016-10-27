'use strict';

const _ = require('lodash');
const Promise = require('bluebird');

class PubSub {
    /**
     * @param options:
     * @param options.engine.type: redis/sqs default: redis
     * @param options.engine.options: engine options
     */
    constructor(options) {
        let engine = _.get(options, 'engine', {
            type: 'redis',
            options: {
                port: 6379,
                host: 'localhost'
            }
        });

        let Engine = require(`./engines/${engine.type}`);
        this.pubsub = new Engine(engine.options);
        this.workers = {};

        this.pubsub.on('message', this._onMessages.bind(this));
    }

    publish(message) {
        if (typeof message === 'object' && message.type && message.action) {
            let event = `${message.type}:${message.action}`;
            return this.pubsub.publish(event, {
                body: message
            });
        }

        return Promise.reject('Message is not valid');
    }

    subscribe(event, handler) {
        this.pubsub.subscribe(event);
        if (!this.workers.hasOwnProperty(event)) {
            this.workers[event] = [];
        }

        this.workers[event].push(handler);
    }

    _onMessages(data) {
        let actions = [];

        for (let msg of data) {
            actions.push(this._proccessMsg(msg));
            actions.push(this.pubsub.delete(msg.ref));
        }

        return Promise.all(actions);
    }

    _proccessMsg(msg) {
        let body = msg.body;
        if (body.type && body.action) {
            let event = `${body.type}:${body.action}`;
            let workers = this.workers[event];

            if (_.isArray(workers)) {
                let actions = [];

                for (let worker of workers) {
                    actions.push(worker.handler(body));
                }

                return Promise.all(actions);
            }

            return Promise.resolve();
        }
    }
}

module.exports = PubSub;