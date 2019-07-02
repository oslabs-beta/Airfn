const {
  createHandler,
  createCallback,
  promiseHandler,
} = require('./serveController')();

/* Sets up test mocks for Express request and response objects */
function setup() {
  const req = {
    body: {},
    path: '',
    url: '',
  };
  const res = {
    locals: {
      error: {},
      lambdaResponse: {},
    },
    statusCode: null,
    body: '',
    headers: {},
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
    await createHandler(dir, useStatic, timeout)(req, res, () => {
      expect(res.locals.error).toEqual(errorObj);
    });
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
    await createHandler(dir, useStatic, timeout)(req, res, () => {
      expect(res.locals.error).not.toEqual(errorObj);
    });
  });

  test('Should have a proper lambdaResponse object in res.locals', async () => {
    const { req, res, next } = setup();
    req.path = '/helloasync';
    req.url = 'http://localhost:9000/helloasync';
    const dir = '/functions';
    const useStatic = false;
    const timeout = 5;
    const lambdaResponse = [
      {
        statusCode: 200,
        body: 'Hello, World',
      },
    ];
    await createHandler(dir, useStatic, timeout)(req, res, () => {
      expect(res.locals.lambdaResponse).not.toEqual(lambdaResponse);
    });
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

  test('Should return a function', async () => {
    const res = {};
    await expect(typeof createCallback(res)).toEqual('function');
  });

  test('Returned callback should be able to handle errors', async () => {
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
    const returnFunc = await createCallback(res);
    expect(returnFunc(new Error('this is an error'), null)).toBeInstanceOf(
      Error
    );
  });

  test('Callback should set proper response object with status code, headers, and body', async () => {
    const { res } = setup();
    const lambdaResponse = {
      statusCode: 200,
      headers: {
        header1: 'Facebook',
        header2: 'Google',
      },
      body: 'Hello, World',
    };
    await createCallback(res)(null, lambdaResponse);
    await expect(res).toMatchObject(lambdaResponse);
  });
});
describe('promiseHandler', () => {});
