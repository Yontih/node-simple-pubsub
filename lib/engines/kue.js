'use strict';

const kue = require('kue');
const Promise = require('bluebird');

const Engine = require('./Engine');

class Kue extends Engine {
    constructor(options) {
        super(options);

        this.queue = kue.createQueue(options);

        if (options.port) {
            kue.app.listen(options.port);
            if (options.title) {
                kue.app.set('title', options.title);
            }
        }

        for (let topic of this.topics) {
            this.subscribe(topic);
        }
    }

    publish(msg) {
        return Promise.each(this.topics, (topic) => {
            return this.internalPublish(msg, topic);
        });
    }

    subscribe(topic) {
        this.queue.process(topic, (job, done) => {
            this.emit('message', job.data);
            done();
        });
    }

    internalPublish(msg, topic) {
        return new Promise((resolve, reject) => {
            this.queue
                .create(topic, msg)
                .save((err) => {
                    if (err) {
                        return reject(err);
                    }

                    return resolve();
                });
        });
    }
}

module.exports = Kue;