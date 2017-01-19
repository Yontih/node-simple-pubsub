'use strict';

const chai = require('chai');

const PubSub = require('../index').PubSub;
const Worker = require('../index').Worker;
const MemoryEngine = require('../lib/engines/memory');
const RedisEngine = require('../lib/engines/redis');

chai.should();

describe('pubsub', () => {

    it('should create new instance', () => {
        let options = {
            topic: 'hello',
            engine: {
                type: 'memory'
            }
        };

        return PubSub.create(options)
            .then((instance) => {
                instance.should.have.property('engine');
                instance.engine.should.not.be.an.instanceOf(RedisEngine);
                instance.engine.should.be.an.instanceOf(MemoryEngine);
                instance.should.have.property('topics').that.is.an('array').that.deep.equal(['hello']);
                instance.should.have.property('workers').that.deep.equal({});
            });
    });

});