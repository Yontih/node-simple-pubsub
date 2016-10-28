'use strict';

module.exports = {
    get: (type) => {
        return require(`./${type}`);
    }
};
