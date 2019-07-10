import { join, parse } from 'path';
import { readFileSync, readdirSync } from 'fs';
import axios, { AxiosResponse } from 'axios';
import { safeDump } from 'js-yaml';
import { createDeployArtifacts, createUserS3Bucket } from './deployController';

const DEPLOY_ENDPOINT = 'http://api.lambda9.cloud/lambda/deploy';
const S3_CREATE_LAMBDA_ENDPOINT = 'http://localhost:9000/createbucket';

interface funcObj {
  funcName: string;
  funcDef: string;
}

export default (
  user: string | void,
  project: string | void,
  functionsOutput: string | void
) => {
  return new Promise((resolve, reject) => {
    const deployArtifacts = createDeployArtifacts(
      functionsOutput,
      join,
      {
        readFileSync,
        readdirSync,
      },
      safeDump
    );
    createUserS3Bucket(S3_CREATE_LAMBDA_ENDPOINT, user, axios.post).then((response: any) => {
      const requestData = {
        user,
        project,
        ...deployArtifacts
      };
       axios
        .post(DEPLOY_ENDPOINT, requestData)
        .then((response: AxiosResponse) => {
          const lambdaData = {
            endpoints,
            data: response.data,
          };
          return resolve(lambdaData);
        })
        .catch(err => {
          return reject(err);
        });
    }).catch((err: Error) => {
      console.log('😓   Error making S3 buckets for lambda functions', err);
    });
    const endpoints = deployArtifacts.funcArr.map((funcObj: funcObj) => {
    return parse(funcObj.funcName).name.toLowerCase();
    });
});
};
