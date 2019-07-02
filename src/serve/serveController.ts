import express from "express";
import path from "path";
import queryString from "querystring";

const app: Express.Application = express();
module.exports = () => ({
  createHandler: (dir: string, useStatic: boolean, timeout: number) => {
    return function (
      req: Express.Request,
      res: Express.Response,
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
  //headers are for now any.. will find bette way later
  createCallback: (res: { body: string; statusCode: number; headers: any }) => {
    // res.body = 'sadf';
    return function callback(err: Error, lambdaResponse: any) {
      // res.body = 'sadf';
      // console.log(lambdaResponse);
      if (err) return err
      res.statusCode = lambdaResponse.statusCode;
      for (let key in lambdaResponse.headers) {
        res.headers[key] = lambdaResponse.headers[key];
      }

      if (lambdaResponse.body) {
        res.body = lambdaResponse.body;
      }
    }
  },
  promiseHandler: (promise: Function, cb: Function) => { },
});
