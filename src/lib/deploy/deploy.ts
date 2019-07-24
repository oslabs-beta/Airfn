import { join, parse } from 'path';
import { readFileSync, readdirSync } from 'fs';
import axios, { AxiosResponse } from 'axios';
import { safeDump } from 'js-yaml';
import { createDeployArtifacts, createUserS3Bucket } from './deployController';

const DEPLOY_ENDPOINT = 'http://api.lambda9.cloud/lambda/deploy';
const S3_CREATE_LAMBDA_ENDPOINT = 'https://test.lambda9.cloud/cli/createbucket';
const CREATE_DOMAIN_ENDPOINT = 'http://localhost:9000/deploydomain';
const SAVE_FUNCTIONS_ENDPOINT = 'http://localhost:9000/savefunctions';
const LOGS_SUBSCRIPTION_ENDPOINT = 'http://localhost:9000/subscribelogs';

//  ✅ 1. Add the endpoints, first localhost then URLs
// ✅ 2. Make user functions object with spreading
// 3. Reduce to make log group prefixes with project name and function names
// 4. Invoke functions in right order
// ✅ 5. Check to see if domain already exists, if not create it
// ✅ 6. Check to see if logged in, if not then suggest to init first
// ✅ 7. Have simple log out ability
//  8. Have message about taking long for initial domain creation

interface funcObj {
  funcName: string;
  funcDef: string;
}

export default (
  user: string | void,
  accessKey: string,
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
    createUserS3Bucket(S3_CREATE_LAMBDA_ENDPOINT, user, axios.post)
      .then((response: any) => {
        const requestData = {
          user,
          project,
          ...deployArtifacts,
        };
        // saveFunctions(deployArtifacts.funcArr, project, accessKey)
        // createDomain(project, project);
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
            return resolve(lambdaData);
          })
          .catch(err => {
            return reject(err);
          });
      })
      .catch((err: Error) => {
        console.log('😓   Error making S3 buckets for lambda functions', err);
      });

    const endpoints = createEndpoints(deployArtifacts.funcArr);
  });
};

function createDomain(subdomainPrefix: string, stackName: string) {
  const data = {
    domainName: `${subdomainPrefix}.lambda9.cloud`,
    stackName
  }

  axios({
    method: "post",
    url: CREATE_DOMAIN_ENDPOINT,
    data
  })
    .then((response: AxiosResponse) => {
      console.log(response.data);
    })
    .catch(err => {
        console.log('😓   Error creating lambda subdomain', err);
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
    data
  })
    .then((response: AxiosResponse) => {
      console.log(response.data);
    })
    .catch(err => {
      console.log("😓   Error creating lambda hosting subdomain", err);
    });
}

function createLogGroupPrefixes(functions, projectName) {
  return functions.map(funcObj => {
    const funcName = parse(funcObj.funcName).name;
    return `/aws/lambda/${projectName}-${funcName}`;
  })
}

function subscribeToLogs(logGroups) {
  const logGroupsPrefixes = createLogGroupPrefixes();
  const data = {
    logGroupsPrefixes
  };

  axios({
    method: "post",
    url: LOGS_SUBSCRIPTION_ENDPOINT,
    data
  })
    .then((response: AxiosResponse) => {
      console.log(response.data);
    })
    .catch(err => {
      console.log("😓   Error creating subscribing to logs", err);
    });

}

function createEndpoints(functions) {
  return functions.map((funcObj: funcObj) => {
      return parse(funcObj.funcName).name.toLowerCase();
    });
}

