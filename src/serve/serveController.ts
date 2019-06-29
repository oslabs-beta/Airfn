module.exports = () => ({
  createHandler: (dir: string, useStatic: boolean, timeout: number) => { },
  createCallback: (res: { headers: string; statusCode: number }) => { },
  promiseHandler: (promise: Function, cb: Function) => { },
}); 
