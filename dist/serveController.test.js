"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const { createHandler, createCallback, promiseHandler, } = require('./serveController')();
// ✅ ️️❗️ func path should be the last element of request path
// ✅❗️ module path should match some pattern
// ❓ mock createCallback function should have been called one time
// ❓... and with these args
// ❓ mock handlerPromise function should have been called one
// ❓... and with these args
/* Sets up test mocks for Express request and response objects */
function setup() {
    const req = {
        body: {},
        path: '',
    };
    const res = {
        locals: {
            error: {},
            lambdaResponse: {},
        },
        statusCode: null,
        body: '',
        headers: {}
    };
    const next = jest.fn();
    Object.assign(res, {
        status: jest.fn(function status() {
            return this;
        }.bind(res)),
        json: jest.fn(function json() {
            return this;
        }.bind(res)),
        send: jest.fn(function send() {
            return this;
        }.bind(res)),
    });
    return { req, res, next };
}
describe('createHandler', () => {
    xtest('Should have proper error object in res.locals if requiring function module fails', () => __awaiter(this, void 0, void 0, function* () {
        const { req, res, next } = setup();
        req.path = '/helloasync';
        const dir = '/functions';
        const useStatic = false;
        const timeout = 5;
        const errorObj = {
            code: 500,
            type: 'Server',
            message: 'Loading function failed',
        };
        yield createHandler(dir, useStatic, timeout)(req, res, next);
        expect(res.locals.error).toEqual(errorObj);
    }));
    xtest('Should have a proper error object in res.locals if lambda is not invoked before timeout', () => __awaiter(this, void 0, void 0, function* () {
        const { req, res, next } = setup();
        req.path = '/helloasync';
        const dir = '/functions';
        const useStatic = false;
        const timeout = 5;
        const errorObj = {
            code: 400,
            type: 'Client',
            message: 'Failed to invoke function before timeout',
        };
        yield createHandler(dir, useStatic, timeout)(req, res, next);
        expect(res.locals.error).toEqual(errorObj);
    }));
    xtest('Should have a proper lambdaResponse object in res.locals', () => __awaiter(this, void 0, void 0, function* () {
        const { req, res, next } = setup();
        req.path = '/helloasync';
        const dir = '/functions';
        const useStatic = false;
        const timeout = 5;
        const lambdaObj = {
            code: 400,
            type: 'Client',
            message: 'Failed to invoke function before timeout',
        };
        const lambdaResponse = {
            path: '/helloasync',
            body: 'Hello, World',
        };
        yield createHandler(dir, useStatic, timeout)(req, res, next);
        expect(res.locals.lambdaResponse).toMatchObject(lambdaResponse);
    }));
});
describe('createCallback', () => {
    const res = {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
        statusCode: 200,
        body: 'Why should you never trust a pig with a ' +
            "secret? Because it's bound to squeal.",
    };
    test('Should return a function', () => __awaiter(this, void 0, void 0, function* () {
        const res = {};
        yield expect(typeof createCallback(res)).toEqual('function');
    }));
    test('Returned callback should be able to handle errors', () => __awaiter(this, void 0, void 0, function* () {
        const res = {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            statusCode: 200,
            body: 'Why should you never trust a pig with a ' +
                "secret? Because it's bound to squeal.",
        };
        const returnFunc = yield createCallback(res);
        expect(returnFunc(new Error('this is an error'), null)).toBeInstanceOf(Error);
    }));
    test('Callback should set proper response object with status code, headers, and body', () => __awaiter(this, void 0, void 0, function* () {
        const { res } = setup();
        const lambdaResponse = {
            statusCode: 200,
            headers: {
                header1: 'Facebook',
                header2: 'Google'
            },
            body: 'Hello, World',
        };
        yield createCallback(res)(null, lambdaResponse);
        yield expect(res).toMatchObject(lambdaResponse);
    }));
});
describe('promiseHandler', () => { });
