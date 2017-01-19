'use strict';
const _ = require('lodash');

/**
 *
 * @param options -  {object: the source, template: string to be returns, params : values to find, statusCode: status code, shouldThrow: should throw or return error
 * @returns {Error}
 */
module.exports = function (options) {
    let msg = null;

    if (!options.object) {
        msg = "Can't validate properties of undefined";
    } else {
        // iterate over all given params and stop on the first one that can't be found
        _.each(options.params, function (param) {
            if (!_.has(options.object, param)) {
                msg = `missing ${param} in options`;
                return false;
            } else {
                return true;
            }
        });

        if (!msg) {
            return true;
        }
    }

    let message = new Error(msg);
    if (options.statusCode) {
        message.statusCode = options.statusCode;
    }

    if (options.throw) {
        throw message
    } else {
        return message;
    }
};