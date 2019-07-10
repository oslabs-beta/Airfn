"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const fs_1 = require("fs");
const axios_1 = __importDefault(require("axios"));
const js_yaml_1 = require("js-yaml");
const deployController_1 = require("./deployController");
const DEPLOY_ENDPOINT = 'http://api.lambda9.cloud/lambda/deploy';
const S3_CREATE_LAMBDA_ENDPOINT = 'http://localhost:9000/createbucket';
exports.default = (user, project, functionsOutput) => {
    return new Promise((resolve, reject) => {
        const deployArtifacts = deployController_1.createDeployArtifacts(functionsOutput, path_1.join, {
            readFileSync: fs_1.readFileSync,
            readdirSync: fs_1.readdirSync,
        }, js_yaml_1.safeDump);
        deployController_1.createUserS3Bucket(S3_CREATE_LAMBDA_ENDPOINT, user, axios_1.default.post).then((response) => {
            const requestData = Object.assign({ user,
                project }, deployArtifacts);
            axios_1.default
                .post(DEPLOY_ENDPOINT, requestData)
                .then((response) => {
                const lambdaData = {
                    endpoints,
                    data: response.data,
                };
                return resolve(lambdaData);
            })
                .catch(err => {
                return reject(err);
            });
        }).catch((err) => {
            console.log('😓   Error making S3 buckets for lambda functions', err);
        });
        const endpoints = deployArtifacts.funcArr.map((funcObj) => {
            return path_1.parse(funcObj.funcName).name.toLowerCase();
        });
    });
};
