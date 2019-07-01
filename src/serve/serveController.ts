module.exports = () => ({
  createHandler: (dir: string, useStatic: boolean, timeout: number) => {
    return function(
      req: Express.Request,
      res: Express.Response,
      next: Function
    ) {
      return;
    };
  },
  createCallback: (res: { headers: string; statusCode: number }) => {},
  promiseHandler: (promise: Function, cb: Function) => {},
});
