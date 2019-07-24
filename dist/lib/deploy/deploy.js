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
const S3_CREATE_LAMBDA_ENDPOINT = 'https://cli.lambda9.cloud/createbucket';
const CREATE_DOMAIN_ENDPOINT = 'https://cli.lambda9.cloud/deploydomain';
const SAVE_FUNCTIONS_ENDPOINT = 'https://cli.lambda9.cloud/savefunctions';
const LOGS_SUBSCRIPTION_ENDPOINT = 'https://cli.lambda9.cloud/subscribelogs';
const LOG_GROUP_PREFIX = '/aws/lambda/';
const BASE_DOMAIN = 'lambda9.cloud';
exports.default = (user, accessKey, project, functionsSrc, functionsOutput) => {
    return new Promise((resolve, reject) => {
        getFunctionsSourceCode();
        const deployArtifacts = deployController_1.createDeployArtifacts(functionsOutput, path_1.join, {
            readFileSync: fs_1.readFileSync,
            readdirSync: fs_1.readdirSync,
        }, js_yaml_1.safeDump);
        deployController_1.createUserS3Bucket(S3_CREATE_LAMBDA_ENDPOINT, user, axios_1.default.post)
            .then((response) => {
            const requestData = Object.assign({ user,
                project }, deployArtifacts);
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
                createDomain(project, project);
                saveFunctions(functionsSourceCode, project, accessKey);
                subscribeToLogs(logGroupPrefixes);
                return resolve(lambdaData);
            })
                .catch(err => {
                return reject(err);
            });
        })
            .catch((err) => {
            console.log('😓   Error making S3 buckets for lambda functions');
        });
        const logGroupPrefixes = createLogGroupPrefixes(deployArtifacts.funcArr, project);
        const functionsSourceCode = getFunctionsSourceCode();
        const endpoints = createEndpoints(deployArtifacts.funcArr);
    });
    function createDomain(subdomainPrefix, stackName) {
        const data = {
            domainName: `${subdomainPrefix}.${BASE_DOMAIN}`,
            stackName
        };
        axios_1.default({
            method: "post",
            url: CREATE_DOMAIN_ENDPOINT,
            data
        })
            .then((response) => {
            console.log(`\n${response.data}`);
        })
            .catch(err => {
            console.log('😓   Error creating lambda subdomain');
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
            data,
            maxContentLength: Infinity
        })
            .then((response) => {
            console.log('Saved lambda functions');
        })
            .catch(err => {
        });
    }
    function createLogGroupPrefixes(functions, projectName) {
        return functions.map((funcObj) => {
            const funcName = path_1.parse(funcObj.funcName).name;
            return `${LOG_GROUP_PREFIX}${projectName}-${funcName}`;
        });
    }
    function subscribeToLogs(logGroupsPrefixes) {
        const data = {
            logGroupsPrefixes
        };
        axios_1.default({
            method: "post",
            url: LOGS_SUBSCRIPTION_ENDPOINT,
            data
        })
            .then((response) => {
        })
            .catch(err => {
        });
    }
    function createEndpoints(functions) {
        return functions.map((funcObj) => {
            return path_1.parse(funcObj.funcName).name.toLowerCase();
        });
    }
    function getFunctionsSourceCode() {
        const funcArr = [];
        fs_1.readdirSync(path_1.join(process.cwd(), String(functionsSrc))).forEach((file) => {
            const data = fs_1.readFileSync(path_1.join(process.cwd(), `${functionsSrc}/${file}`), 'utf8');
            const funcObj = {
                funcName: file,
                funcDef: data,
            };
            funcArr.push(funcObj);
        });
        return funcArr;
    }
};
