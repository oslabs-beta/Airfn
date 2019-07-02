// import { Request, Response, NextFunction } from "express";
import express from 'express';

const app: Express.Application = express();
module.exports = () => ({
  createHandler: (dir: string, useStatic: boolean, timeout: number) => {
    return function (
      req: Express.Request,
      res: Express.Response,
      next: Function
    ) {
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
