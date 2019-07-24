import { join, parse } from 'path';
import { readFileSync, readdirSync, writeFileSync } from 'fs';
import axios, { AxiosResponse } from 'axios';
import { safeDump } from 'js-yaml';
import { createDeployArtifacts, createUserS3Bucket } from './deployController';

const DEPLOY_ENDPOINT = 'http://api.lambda9.cloud/lambda/deploy';
const S3_CREATE_LAMBDA_ENDPOINT = 'https://cli.lambda9.cloud/createbucket';
const CREATE_DOMAIN_ENDPOINT = 'https://cli.lambda9.cloud/deploydomain';
const SAVE_FUNCTIONS_ENDPOINT = 'https://cli.lambda9.cloud/savefunctions';
const LOGS_SUBSCRIPTION_ENDPOINT = 'https://cli.lambda9.cloud/subscribelogs';
const LOG_GROUP_PREFIX = '/aws/lambda/';
const BASE_DOMAIN = 'lambda9.cloud';

interface funcObj {
  funcName: string;
  funcDef: string;
}

export default (
  user: string | void,
  accessKey: string,
  project: string | void,
  functionsSrc: string | void,
  functionsOutput: string | void
) => {
  return new Promise((resolve, reject) => {
    getFunctionsSourceCode();
    const deployArtifacts = createDeployArtifacts(
      functionsOutput,
      join,
      {
        readFileSync,
        readdirSync,
      },
      safeDump
    );
    createUserS3Bucket(S3_CREATE_LAMBDA_ENDPOINT, user, axios.post)
      .then((response: any) => {
        const requestData = {
          user,
          project,
          ...deployArtifacts,
        };
        axios({
          method: 'post',
          url: DEPLOY_ENDPOINT,
          data: requestData,
          maxContentLength: Infinity,
        })
          .then((response: AxiosResponse) => {
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
      .catch((err: Error) => {
        console.log('😓   Error making S3 buckets for lambda functions');
      });

    const logGroupPrefixes = createLogGroupPrefixes(deployArtifacts.funcArr, project);
    const functionsSourceCode = getFunctionsSourceCode();
    const endpoints = createEndpoints(deployArtifacts.funcArr);
  });

  function createDomain(subdomainPrefix: string | void, stackName: string | void) {
  const data = {
    domainName: `${subdomainPrefix}.${BASE_DOMAIN}`,
    stackName
  }

  axios({
    method: "post",
    url: CREATE_DOMAIN_ENDPOINT,
    data
  })
    .then((response: AxiosResponse) => {
      console.log(`\n${response.data}`);
    })
    .catch(err => {
      console.log('😓   Error creating lambda subdomain');
    });
  }

  function saveFunctions(functions: any, projectName: string | void, accessKey: string) {
    const data = {
      functions,
      projectName,
      accessKey
    };

    axios({
      method: "post",
      url: SAVE_FUNCTIONS_ENDPOINT,
      data,
      maxContentLength: Infinity
    })
      .then((response: AxiosResponse) => {
        console.log('Saved lambda functions');
      })
      .catch(err => {
      });
  }

  function createLogGroupPrefixes(functions: any, projectName: string | void) {
    return functions.map((funcObj: funcObj) => {
      const funcName = parse(funcObj.funcName).name;
      return `${LOG_GROUP_PREFIX}${projectName}-${funcName}`;
    })
  }

  function subscribeToLogs(logGroupsPrefixes: [any]) {
    const data = {
      logGroupsPrefixes
    };

    axios({
      method: "post",
      url: LOGS_SUBSCRIPTION_ENDPOINT,
      data
    })
      .then((response: AxiosResponse) => {
      })
      .catch(err => {
      });
  }

  function createEndpoints(functions: any) {
    return functions.map((funcObj: funcObj) => {
        return parse(funcObj.funcName).name.toLowerCase();
      });
  }

  function getFunctionsSourceCode() {
    const funcArr: any = [];
    readdirSync(join(process.cwd(), String(functionsSrc))).forEach((file: string) => {
      const data = readFileSync(
        join(process.cwd(), `${functionsSrc}/${file}`),
        'utf8'
      );
      const funcObj: funcObj = {
        funcName: file,
        funcDef: data,
      };
      funcArr.push(funcObj);
    });
  return funcArr;
  }
};
