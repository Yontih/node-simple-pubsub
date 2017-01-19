'use strict';

const _ = require('lodash');
const Promise = require('bluebird');

const engines = require('./engines');
const validateProperties = require('./utils/validateProperties');

class PubSub {
    /**
     * @param options:
     * @param options.topic
     * @param options.engine.type: redis/sqs default: redis
     * @param options.engine.options: engine options
     */
    constructor(options) {
        let engine = options.engine;
        this.topics = options.topics;
        this.engine = engine;
        this.engine.on('message', (msg) => {
            this._proccessMsg(msg);
        });
        this.workers = {};
    }

    /**
     *
     * @param options:
     * @param options.topic: (array/string)
     * @param options.engine:
     * @param options.engine.type
     * @param options.engine.options
     */
    static create(options) {
        return new Promise((resolve, reject) => {
            validateProperties({
                object: options,
                params: ['engine', 'engine.type', 'topic'],
                throw: true
            });

            let Engine = engines.get(options.engine.type);
            if (Engine) {
                let engine = new Engine(options.engine);
                let topics = _.isArray(options.topic) ? options.topic : [options.topic];
                return engine
                    .init()
                    .then(() => {
                        let instance = new PubSub({engine, topics});
                        return Promise.map(topics, (t) => {
                            return engine.subscribe(t);
                        }).return(instance);
                    })
                    .then(resolve);
            }

            return reject(new Error('Engine does not exists'));
        });
    }

    publish(msg) {
        if (typeof msg === 'object' && msg.type && msg.action) {
            return Promise.map(this.topics, (topic) => {
                return this.engine.publish(topic, msg);
            });
        }

        return Promise.reject('Message is not valid');
    }

    subscribe(event, handler) {
        if (!this.workers.hasOwnProperty(event)) {
            this.workers[event] = [];
        }

        this.workers[event].push(handler);
    }

    _proccessMsg(messages) {
        messages = _.isArray(messages) ? messages : [messages];
        return Promise.each(messages, (msg) => {
            if (msg.type && msg.action) {
                msg.event = `${msg.type}:${msg.action}`;
                let workers = this.workers[msg.event];

                if (_.isArray(workers)) {
                    let actions = [];

                    for (let worker of workers) {
                        actions.push(worker.handler(msg));
                    }

                    return Promise.all(actions);
                }

                return Promise.resolve();
            }
        });
    }
}

module.exports = PubSub;