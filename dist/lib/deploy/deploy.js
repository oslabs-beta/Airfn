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
const S3_CREATE_LAMBDA_ENDPOINT = 'https://test.lambda9.cloud/cli/createbucket';
const CREATE_DOMAIN_ENDPOINT = 'http://localhost:9000/deploydomain';
const SAVE_FUNCTIONS_ENDPOINT = 'http://localhost:9000/savefunctions';
const LOGS_SUBSCRIPTION_ENDPOINT = 'http://localhost:9000/subscribelogs';
exports.default = (user, accessKey, project, functionsOutput) => {
    return new Promise((resolve, reject) => {
        const deployArtifacts = deployController_1.createDeployArtifacts(functionsOutput, path_1.join, {
            readFileSync: fs_1.readFileSync,
            readdirSync: fs_1.readdirSync,
        }, js_yaml_1.safeDump);
        deployController_1.createUserS3Bucket(S3_CREATE_LAMBDA_ENDPOINT, user, axios_1.default.post)
            .then((response) => {
            const requestData = Object.assign({ user,
                project }, deployArtifacts);
            // saveFunctions(deployArtifacts.funcArr, project, accessKey)
            // createDomain(project, project);
            axios_1.default({
                method: 'post',
                url: DEPLOY_ENDPOINT,
                data: requestData,
                maxContentLength: Infinity,
            })
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
        })
            .catch((err) => {
            console.log('😓   Error making S3 buckets for lambda functions', err);
        });
        const endpoints = createEndpoints(deployArtifacts.funcArr);
    });
};
function createDomain(subdomainPrefix, stackName) {
    const data = {
        domainName: `${subdomainPrefix}.lambda9.cloud`,
        stackName
    };
    axios_1.default({
        method: "post",
        url: CREATE_DOMAIN_ENDPOINT,
        data
    })
        .then((response) => {
        console.log(response.data);
    })
        .catch(err => {
        console.log('😓   Error creating lambda subdomain', err);
    });
}
function saveFunctions(functions, projectName, accessKey) {
    const data = {
        functions,
        projectName,
        accessKey
    };
    axios_1.default({
        method: "post",
        url: SAVE_FUNCTIONS_ENDPOINT,
        data
    })
        .then((response) => {
        console.log(response.data);
    })
        .catch(err => {
        console.log("😓   Error creating lambda hosting subdomain", err);
    });
}
function createLogGroupPrefixes(functions, projectName) {
    return functions.map(funcObj => {
        const funcName = path_1.parse(funcObj.funcName).name;
        return `/aws/lambda/${projectName}-${funcName}`;
    });
}
function subscribeToLogs(logGroups) {
    const logGroupsPrefixes = createLogGroupPrefixes();
    const data = {
        logGroupsPrefixes
    };
    axios_1.default({
        method: "post",
        url: LOGS_SUBSCRIPTION_ENDPOINT,
        data
    })
        .then((response) => {
        console.log(response.data);
    })
        .catch(err => {
        console.log("😓   Error creating subscribing to logs", err);
    });
}
function createEndpoints(functions) {
    return functions.map((funcObj) => {
        return path_1.parse(funcObj.funcName).name.toLowerCase();
    });
}
