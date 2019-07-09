import { join, parse } from 'path';
import { readFileSync, readdirSync } from 'fs';
import axios, { AxiosResponse } from 'axios';
import { safeDump } from 'js-yaml';
import createDeployArtifacts from './deployController';

const DEPLOY_ENDPOINT = 'http://api.lambda9.cloud/lambda/deploy';

interface funcObj {
  funcName: string;
  funcDef: string;
}

export default () => {
  return new Promise((resolve, reject) => {
    const deployArtifacts = createDeployArtifacts(
      join,
      {
        readFileSync,
        readdirSync,
      },
      safeDump
    );

    const endpoints = deployArtifacts.funcArr.map((funcObj: funcObj) => {
      return parse(funcObj.funcName).name.toLowerCase();
    });

    axios
      .post(DEPLOY_ENDPOINT, deployArtifacts)
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
  });
};
