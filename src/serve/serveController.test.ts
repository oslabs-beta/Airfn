const {
  createHandler,
  createCallback,
  promiseHandler
} = require("./serveController")();

/* Sets up test mocks for Express request and response objects */
function setup() {
  const req = {
    body: {},
    path: "",
    url: ""
  };
  const res = {
    locals: {
      error: {},
      lambdaResponse: {}
    }
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
    )
  });
  return { req, res, next };
}

describe("createHandler", () => {
  test("Should have proper error object in res.locals if requiring function module fails", async () => {
    const { req, res, next } = setup();
    req.path = "/helloasync";
    const dir = "/functions";
    const useStatic = false;
    const timeout = 5;
    const errorObj = {
      code: 500,
      type: "Server",
      message: "Loading function failed"
    };
    await createHandler(dir, useStatic, timeout)(req, res, () => {
      expect(res.locals.error).toEqual(errorObj);
    });
  });

  test("Should have a proper error object in res.locals if lambda is not invoked before timeout", async () => {
    const { req, res, next } = setup();
    req.path = "/helloasync";
    const dir = "/functions";
    const useStatic = false;
    const timeout = 5;
    const errorObj = {
      code: 400,
      type: "Client",
      message: "Failed to invoke function before timeout"
    };
    await createHandler(dir, useStatic, timeout)(req, res, () => {
      expect(res.locals.error).not.toEqual(errorObj);
    });
  });

  test("Should have a proper lambdaResponse object in res.locals", async () => {
    const { req, res, next } = setup();
    req.path = "/helloasync";
    req.url = "http://localhost:9000/helloasync";
    const dir = "/functions";
    const useStatic = false;
    const timeout = 5;
    const lambdaResponse = [
      {
        statusCode: 200,
        body: "Hello, World"
      }
    ];
    await createHandler(dir, useStatic, timeout)(req, res, () => {
      expect(res.locals.lambdaResponse).not.toEqual(lambdaResponse);
    });
  });
});
