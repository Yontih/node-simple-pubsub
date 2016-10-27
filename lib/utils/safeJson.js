'use strict';

module.exports = {
    parse: (s) => {
        try {
            s = JSON.parse(s)
        } catch (err) {
        }

        return s;
    }
};