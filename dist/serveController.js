"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const querystring_1 = __importDefault(require("querystring"));
module.exports = () => ({
    createHandler: (dir, useStatic, timeout) => {
        return function (req, res, next) {
            const fn = req.path.split("/").filter(name => name)[0];
            const joinModPath = path_1.default.join(process.cwd(), dir, fn);
            const handler = require(joinModPath);
            const lambdaReq = {
                path: req.path,
                httpMethod: req.method,
                queryStringParameters: querystring_1.default.parse(req.url.split(/\?(.+)/)[1]),
                headers: req.headers,
                body: req.body
            };
            const promise = handler.handler(lambdaReq, null, null);
            Promise.all([promise]).then(result => res.send(result));
            return;
        };
    },
    createCallback: (res) => { },
    promiseHandler: (promise, cb) => { }
});
