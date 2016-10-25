'use strict';
const _ = require('lodash');

/**
 *
 * @param options -  {object: the source, template: string to be returns, params : values to find, statusCode: status code, shouldThrow: should throw or return error
 * @returns {Error}
 */
module.exports = function (options) {
    let compiledTemplate = _.template(options.template || 'missing ${param} in options');

    let faultyParam;

    if (!options.object) {
        compiledTemplate = _.template("Can't validate properties of undefined");
    } else {
        // iterate over all given params and stop on the first one that can't be found
        _.each(options.params, function (param) {
            if (!options.object.hasOwnProperty(param) || _.isNull(options.object[param])) {
                faultyParam = param;
                return false;
            } else {
                return true;
            }
        });

        if (!faultyParam) {
            return;
        }
    }

    let message = new Error(compiledTemplate({param: faultyParam}));
    if (options.statusCode) {
        message.statusCode = options.statusCode;
    }
    if (options.shouldThrow) {
        throw message
    } else {
        return message;
    }
};