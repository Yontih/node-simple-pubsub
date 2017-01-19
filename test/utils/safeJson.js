'use strict';

const chai = require('chai');

const safeJson = require('../../lib/utils/safeJson');

chai.should();

describe('utils.safeJson', () => {

    it('should parse json successfully', (done) => {
        let str = JSON.stringify({
            f1: 123,
            f2: 'abc',
            f3: 10
        });

        let obj = safeJson.parse(str);
        obj.should.be.an.object;
        obj.should.have.property('f1').that.equal(123);
        obj.should.have.property('f2').that.equal('abc');
        obj.should.have.property('f3').that.equal(10);

        done();
    });

    it('should return the given string', (done) => {
        let str = '{f1: foo, f2: 123}';
        let obj = safeJson.parse(str);
        obj.should.be.an.string;
        obj.should.equal(str);

        done();
    });

});