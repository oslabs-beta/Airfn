const {
  createHandler,
  createCallback,
  promiseHandler,
} = require('./serveController')();

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
  };
  const next = jest.fn();
  Object.assign(res, {
    status: jest.fn(
      function status(this: object) {
        return this;
      }.bind(res)
    ),
    json: jest.fn(
      function json(this: object) {
        return this;
      }.bind(res)
    ),
    send: jest.fn(
      function send(this: object) {
        return this;
      }.bind(res)
    ),
  });
  return { req, res, next };
}

describe('createHandler', () => {
  test('Should have proper error object in res.locals if requiring function module fails', async () => {
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
    await createHandler(dir, useStatic, timeout)(req, res, next);

    expect(res.locals.error).toEqual(errorObj);
  });

  test('Should have a proper error object in res.locals if lambda is not invoked before timeout', async () => {
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
    await createHandler(dir, useStatic, timeout)(req, res, next);

    expect(res.locals.error).toEqual(errorObj);
  });

  test('Should have a proper lambdaResponse object in res.locals', async () => {
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
    await createHandler(dir, useStatic, timeout)(req, res, next);

    expect(res.locals.lambdaResponse).toMatchObject(lambdaResponse);
  });
});
describe('createCallback', () => {
  const res = {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    statusCode: 200,
    body:
      'Why should you never trust a pig with a ' +
      "secret? Because it's bound to squeal.",
  };
});
describe('promiseHandler', () => {});
