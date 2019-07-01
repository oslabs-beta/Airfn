"use strict";
module.exports = () => ({
    createHandler: (dir, useStatic, timeout) => {
        return function (req, res, next) {
            return;
        };
    },
    createCallback: (res) => { },
    promiseHandler: (promise, cb) => { },
});
