import express from "express";
import path from "path";
import queryString from "querystring";

module.exports = () => ({
  createHandler: (dir: string, useStatic: boolean, timeout: number) => {
    return function(
      req: express.Request,
      res: express.Response,
      next: Function
    ) {
      const fn: string = req.path.split("/").filter(name => name)[0];
      const joinModPath = path.join(process.cwd(), dir, fn);
      const handler = require(joinModPath);
      const lambdaReq = {
        path: req.path,
        httpMethod: req.method,
        queryStringParameters: queryString.parse(req.url.split(/\?(.+)/)[1]),
        headers: req.headers,
        body: req.body
      };

      const promise = handler.handler(lambdaReq, null, null);
      Promise.all([promise]).then(result => res.send(result));
      return;
    };
  },
  createCallback: (res: { headers: string; statusCode: number }) => {},
  promiseHandler: (promise: Function, cb: Function) => {}
});
