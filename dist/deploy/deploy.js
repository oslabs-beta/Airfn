"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const fs_1 = require("fs");
const axios_1 = __importDefault(require("axios"));
const js_yaml_1 = require("js-yaml");
const deployController_1 = __importDefault(require("./deployController"));
const DEPLOY_ENDPOINT = 'http://api.lambda9.cloud/lambda/deploy';
exports.default = () => {
    return new Promise((resolve, reject) => {
        const deployArtifacts = deployController_1.default(path_1.join, {
            readFileSync: fs_1.readFileSync,
            readdirSync: fs_1.readdirSync,
        }, js_yaml_1.safeDump);
        axios_1.default
            .post(DEPLOY_ENDPOINT, deployArtifacts)
            .then((response) => {
            return resolve(response.data);
        })
            .catch(err => {
            return reject(err);
        });
    });
};
