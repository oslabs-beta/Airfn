const {
  createHandler,
  createCallback,
  promiseHandler,
} = require('./serveController')();

describe('createHandler', () => {
  const dir = '/functions';
  const useStatic = false;
  const timeout = 5;
  it('Should return a function', () => {
    expect(typeof createHandler(dir, useStatic, timeout)).toBe('function');
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
  const error = {
    error: true,
  };
  it('Should return a function', () => {
    expect(typeof createCallback(res)).toBe('function');
  });
  it('Should return error if err is passed to the callback function', () => {
    expect(createCallback(res)(error, null)).toBeTruthy();
  });
});
describe('promiseHandler', () => {
  const promise = 'to be filled in later';
  const notAPromise = 'to be filled in later';
  const cb = 'to be filled in later';
  const notAFunction = 'to be filled in later';
  it('Should return undefined if promise argument is falsey', () => {
    expect(promiseHandler(promise, cb)).not.toBeTruthy();
  });
  it('Should return undefined if promise.then is not a function', () => {
    expect(typeof promiseHandler(notAPromise, cb)).toBe('undefined');
  });
  it('Should return undefined if callback argument is not a function', () => {
    expect(typeof promiseHandler(promise, notAFunction)).toBe('undefined');
  });
  it('Should return a promise of all arguments are valid', () => {
    expect(promiseHandler(promise, cb).then).toBeTruthy();
  });
});
