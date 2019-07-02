"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// import { Request, Response, NextFunction } from "express";
const express_1 = __importDefault(require("express"));
const app = express_1.default();
module.exports = () => ({
    createHandler: (dir, useStatic, timeout) => {
        return function (req, res, next) {
            return;
        };
    },
    //headers are for now any.. will find bette way later
    createCallback: (res) => {
        // res.body = 'sadf';
        return function callback(err, lambdaResponse) {
            // res.body = 'sadf';
            // console.log(lambdaResponse);
            if (err)
                return err;
            res.statusCode = lambdaResponse.statusCode;
            for (let key in lambdaResponse.headers) {
                res.headers[key] = lambdaResponse.headers[key];
            }
            if (lambdaResponse.body) {
                res.body = lambdaResponse.body;
            }
        };
    },
    promiseHandler: (promise, cb) => { },
});
