'use strict';

const _ = require('lodash');
const Promise = require('bluebird');

const engines = require('./engines');
const validateProperties = require('./utils/validateProperties');

class PubSub {
    /**
     * @param options:
     * @param options.engine.type: redis/sqs default: redis
     * @param options.engine.options: engine options
     */
    constructor(options) {
        validateProperties({
            object: options,
            params: ['engine', 'event'],
            shouldThrow: true
        });

        let engine = _.merge({
            type: 'redis',
            options: {
                event: options.event,
                port: 6379,
                host: 'localhost'
            }
        }, options.engine);

        let Engine = engines.get(engine.type);
        if (Engine) {
            this.pubsub = new Engine(engine.options);
            this.workers = {};

            this.pubsub.on('message', this._onMessage.bind(this));
        } else {
            throw new Error('Engine does not exists');
        }
    }

    publish(msg) {
        if (typeof msg === 'object' && msg.type && msg.action) {
            let event = `${msg.type}:${msg.action}`;
            return this.pubsub.publish(event, msg);
        }

        return Promise.reject('Message is not valid');
    }

    subscribe(event, handler) {
        if (!this.workers.hasOwnProperty(event)) {
            this.workers[event] = [];
        }

        this.workers[event].push(handler);
    }

    _onMessage(msg) {
        return this._proccessMsg(msg);
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