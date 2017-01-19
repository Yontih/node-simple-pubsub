'use strict';

const chai = require('chai');

const validateProperties = require('../../lib/utils/validateProperties');

chai.should();

describe('utils.validateProperties', () => {

    it('should validate object successfully', (done) => {
        let result = validateProperties({
            object: {
                f1: 1,
                f2: false,
                f3: {
                    a: 1,
                    b: true
                }
            },
            params: ['f1', 'f2', 'f3', 'f3.a', 'f3.b'],
            throw: true
        });

        result.should.be.an.boolean;
        result.should.equal(true);

        done();
    });

    it('should throw error', (done) => {
        try {
            validateProperties({
                object: {f1: 1, f2: false},
                params: ['f1', 'f2', 'f3'],
                throw: true
            });
        } catch (err) {
            err.should.have.property('message').that.equal('missing f3 in options');
        } finally {
            done();
        }
    });

    it('should return error', (done) => {
        let result = validateProperties({
            object: {f1: 1, f2: false},
            params: ['f1', 'f2', 'f3'],
            throw: false
        });

        result.should.be.an.object;
        result.should.have.property('message').that.equal('missing f3 in options');

        done();
    });

    it('should throw undefiend error', (done) => {
        try {
            validateProperties({
                params: ['f1', 'f2', 'f3'],
                throw: true
            });
        } catch (err) {
            err.should.have.property('message').that.equal("Can't validate properties of undefined");
        } finally {
            done();
        }
    });

});