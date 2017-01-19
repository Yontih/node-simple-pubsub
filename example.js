'use strict';

const Promise = require('bluebird');
const _ = require('lodash');

const PubSub = require('./index').PubSub;
const Worker = require('./index').Worker;

// define pubsub engine
const options = {
    engine: {
        type: 'redis',
        options: {
            host: 'localhost',
            port: 6379
        }
    }
};

const sqsOptions = {
    topic: 'bla',
    engine: {
        type: 'sqs',
        url: 'https://sqs.ap-southeast-2.amazonaws.com/805787217936/etl_triggers',
        region: 'ap-southeast-2'
    }
};

const memoryOptions = {
    topic: 'bla',
    engine: {
        type: 'memory'
    }
};


// create options for the 1st pubsub
let o1 = Object.assign(_.cloneDeep(options), {topic: 't1'});
// create options for the 2nd pubsub
let o2 = Object.assign(_.cloneDeep(options), {topic: 't2'});

Promise
    .all([
        PubSub.create(o1),
        PubSub.create(memoryOptions),
        PubSub.create(sqsOptions)
    ])
    .spread((inst1, memoryInst, sqsInst) => {

        /**
         * Create 1st worker and register to the events.
         * Use the 1st pubsub as the subscriber and the 2nd pubsub as the publisher
         */
        new Worker({
            event: ['bla:foo', {type: 'app', action: 'added'}, 'type:action'],
            subscribers: [inst1],
            publishers: [memoryInst],
            handler(event) {
                console.log('WORKER_1:', event);

                return this.publish(event)
                    .catch((err) => console.log(err));
            }
        }).subscribe();

        /**
         * Create 2nd worker and register to the events.
         * Use the 2nd pubsub as the subscriber
         */
        new Worker({
            event: ['bla:foo', {type: 'app', action: 'added'}, 'type:action'],
            subscribers: [memoryInst],
            handler(event) {
                console.log('WORKER_2:', event);
            }
        }).subscribe();

        /**
         * publish messages
         */
        return Promise.all([
            sqsInst.publish({type: 'bla', action: 'foo', data: 'hi'}),
            // inst1.publish({type: 'type', action: 'action', data: 'hi2'}),
            inst1.publish({type: 'app', action: 'added', data: 'xxxx-xxxx-xxxx-xxxx'})
        ]);
    });

