#!/usr/bin/env node

import os from 'os';
import fs from 'fs';
import path from 'path';
import program from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import axios, { AxiosResponse } from 'axios';
import listen from '../lib/serve/serve';
import { run, watch } from '../lib/build/build';
import deploy from '../lib/deploy/deploy';
import { projConfig } from '../lib/types';
import { config } from 'rxjs';

// TODO allow custom configuration of API Gateway subdomain
const ROOT_CONFIG_FILENAME = 'config.json';
const ROOT_CONFIG_DIRNAME = '.airfn';
const BASE_API_GATEWAY_ENDPOINT = 'lambda9.cloud';
const AUTH_ENDPOINT = 'https://test.lambda9.cloud/cli/cliauth';
const SPINNER_TIMEOUT = 1000;
declare global {
  interface JSON {
    parse(text: Buffer, reviver?: (key: any, value: any) => any): any;
  }
}

const JSONpackage = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'))
);

program.version(JSONpackage.version);

program
  .command('init')
  .description(
    'Initialize configuration for serving, building, and deploying lambda functions'
  )
  .action(async () => {
    const airfnConfig: projConfig = {};
    const cwdName: string = path.parse(process.cwd()).name;

    console.log(`\n👤 Please login with your username and password\nYou can sign up for an account at https://airfn.io/signup\n`);

    // TODO: Implement actual auth
    await inquirer
      .prompt([
        {
          name: 'username',
          message: 'Username:',
        },
      ])
      .then(async (answers: any) => {
        const username = answers.username;
        airfnConfig.user = answers.username;
        await inquirer
        .prompt([
          {
            name: 'password',
            type: 'password',
            message: 'Password:',
          },
        ])
      .then(async (answers: any) => {
          const password = answers.password;
          const credentials = {
            username,
            password
          }
          await axios.post(AUTH_ENDPOINT, credentials).then((response: AxiosResponse) => {
            const homedir = os.homedir();
            const rootConfigDir = path.join(homedir, ROOT_CONFIG_DIRNAME);
            const rootConfigPath = path.join(rootConfigDir, ROOT_CONFIG_FILENAME);

            const rootConfig = {
                  clientId: response.data
                };
            if (!fs.existsSync(rootConfigDir)){
              fs.mkdir(rootConfigDir, (err) => {
                if (err) console.log(`😓    Failed to build config: ${err}`);            
            });            }
            fs.writeFile(rootConfigPath, JSON.stringify(rootConfig), err => {
                if (err) console.log(`😓    Failed to build config: ${err}`);
            });
          }).catch((err: Error) => {
            console.log(`❌ Wrong username/password combination.\n Retry by running 'air init' again`);
            process.exit()
          })
      });
      });

    await inquirer
      .prompt([
        {
          name: 'project',
          message: 'Enter project name for your lambda functions:',
          default: cwdName,
        },
      ])
      .then((answers: any) => {
        airfnConfig.project = answers.project;
      });

    await inquirer
      .prompt([
        {
          name: 'functionsSrc',
          message: 'In which directory are your lambda functions?',
          default: 'src/functions',
        },
      ])
      .then(async (answers: any) => {
        const functionsSrc = answers.functionsSrc;
        airfnConfig.functionsSrc = functionsSrc;
        if (!fs.existsSync(answers.functionsSrc)) {
          await inquirer
            .prompt([
              {
                type: 'confirm',
                name: 'createSrcDir',
                message: `There's no directory at ${
                  answers.functionsSrc
                }. Would you like to create one now?`,
              },
            ])
            .then((answers: any) => {
              if (answers.createSrcDir === true && functionsSrc) {
                fs.mkdirSync(path.join(process.cwd(), functionsSrc!), {
                  recursive: true,
                });
              }
            });
        }
      });

    await inquirer
      .prompt([
        {
          name: 'functionsOutput',
          message:
            'In which directory would you like your built lambda functions? (a root level directory is recommended)',
          default: '/functions',
        },
      ])
      .then((answers: any) => {
        airfnConfig.functionsOutput = answers.functionsOutput;
      });

    await inquirer
      .prompt([
        {
          type: 'list',
          name: 'nodeRuntime',
          message: 'Which NodeJS runtime will your lambda functions use?',
          choices: ['10.15', '8.10'],
        },
      ])
      .then((answers: any) => {
        airfnConfig.nodeRuntime = answers.nodeRuntime;
      });

    await inquirer
      .prompt([
        {
          name: 'functionsOutput',
          message:
            'On which local port do you want to serve your lambda functions?',
          default: '9000',
        },
      ])
      .then((answers: any) => {
        airfnConfig.port = Number(answers.functionsOutput);
      });

    fs.writeFile('airfn.json', JSON.stringify(airfnConfig), err => {
      if (err) console.log(`😓    Failed to build config: ${err}`);
      console.log('\n💾   Your Airfn config has been saved!');
    });
  });

program
  .command('serve')
  .description('Serve and watch functions')
  .action(() => {
    getUserAccessKey();
    const airfnConfig = getUserLambdaConfig()!;
    const spinner = ora('☁️   Airfn: Serving functions...').start();
    setTimeout(() => {
      const useStatic = Boolean(program.static);
      let server: any;
      const startServer = () => {
        server = listen(
          airfnConfig.functionsOutput,
          airfnConfig.port || 9000,
          useStatic,
          Number(program.timeout) || 10
        );
      };
      if (useStatic) {
        startServer();
        return;
      }
      const { config: userWebpackConfig, babelrc: useBabelrc = true } = program;
      watch(
        airfnConfig.functionsSrc,
        airfnConfig.functionsOutput,
        airfnConfig.nodeRuntime,
        { userWebpackConfig, useBabelrc },
        (err: Error, stats: any) => {
          if (err) {
            console.error(err);
            return;
          }
          console.log(chalk.hex('#24c4f4')(stats.toString()));
          spinner.stop();
          if (!server) {
            startServer();
            console.log('\n✅  Done serving!');
          } else {
            console.log('\n🔨  Done rebuilding!');
          }

          stats.compilation.chunks.forEach((chunk: any) => {
            server.clearCache(chunk.name || chunk.id().toString());
          });
        }
      );
    }, SPINNER_TIMEOUT);
  });

program
  .command('build')
  .description('Build functions')
  .action(() => {
    getUserAccessKey();
    const spinner = ora('☁️   Airfn: Building functions...').start();
    setTimeout(() => {
      const airfnConfig = getUserLambdaConfig()!;
      spinner.color = 'green';
      const { config: userWebpackConfig, babelrc: useBabelrc = true } = program;
      run(
        airfnConfig.functionsSrc,
        airfnConfig.functionsOutput,
        airfnConfig.nodeRuntime,
        {
          userWebpackConfig,
          useBabelrc,
        }
      )
        .then((stats: any) => {
          console.log(chalk.hex('#f496f4')(stats.toString()));
          spinner.stop();
          console.log('\n✅  Done building!');
        })
        .catch((err: Error) => {
          console.error(err);
          process.exit(1);
        });
    }, SPINNER_TIMEOUT);
  });

program
  .command('deploy')
  .description('Deploys functions to AWS')
  .action(() => {
    const accessKey = getUserAccessKey();
    const airfnConfig = getUserLambdaConfig()!;
    const spinner = ora('☁️   Airfn: Deploying functions...').start();
    setTimeout(() => {
      const { config: userWebpackConfig, babelrc: useBabelrc = true } = program;
      // TODO: Handle already built functions
      run(
        airfnConfig.functionsSrc,
        airfnConfig.functionsOutput,
        airfnConfig.nodeRuntime,
        { userWebpackConfig, useBabelrc }
      )
        .then((stats: any) => {
          console.log(chalk.hex('#f496f4')(stats.toString()));
          deploy(
            airfnConfig.user,
            accessKey,
            airfnConfig.project,
            airfnConfig.functionsSrc,
            airfnConfig.functionsOutput
          )
            .then((result: any) => {
              // TODO: Give lambda endpoints to user
              spinner.stop();
              console.log(`\n🚀   Successfully deployed! ${result.data}`);
              console.log(`\n🔗   Lambda endpoints:`);
              result.endpoints.forEach((endpoint: string) => {
                console.log(
                  `https://${airfnConfig.project}.${BASE_API_GATEWAY_ENDPOINT}/${endpoint}`
                );
              });
            })
            .catch((err: Error) => {
              spinner.stop();
              console.log(`😓   Failed to deploy: ${err}`);
            });
        })
        .catch((err: Error) => {
          console.error(err);
          process.exit(1);
        });
    }, SPINNER_TIMEOUT);
  });

program
  .command('logout')
  .description('Log out of Airfn CLI')
  .action(() => {
    const { configFound, configDir } = rootConfigExists();
    if (configFound) {
      try {
        removeDir(configDir);
        console.log('Logged out of Airfn CLI');
        process.exit(0);
      } catch(err) {
        console.error(`Failed to log out`);
      } 
    } else {
        console.log(`Already logged out`);
        process.exit(1);
      }
  });

program.on('command:*', function() {
  console.error(`\n❌  "${program.args.join(' ')}" command not found!`);
  process.exit(1);
});

program.parse(process.argv);

const NO_COMMAND_SPECIFIED = program.args.length === 0;

if (NO_COMMAND_SPECIFIED) {
  program.help();
}

function getUserAccessKey() {
  const { configFound, configPath } = rootConfigExists();
  if (configFound) {
    try {
      const rootConfig = JSON.parse(
      fs.readFileSync(configPath, 'utf-8')
    );
    return rootConfig.clientId;
    } catch (err) {
      console.log(`❌ Error reading config`)
    }
    
  } else {
    console.log(`❗️ Please login first by running 'air init'`);
    process.exit(1);
  }
}

function rootConfigExists() {
  const homedir = os.homedir();
  const rootConfigDir = path.join(homedir, ROOT_CONFIG_DIRNAME);
  const rootConfigPath = path.join(rootConfigDir, ROOT_CONFIG_FILENAME);
  const configFound = fs.existsSync(rootConfigPath);
  const configProps =  { 
      configFound: configFound, 
      configDir: rootConfigDir,
      configPath: rootConfigPath 
    };
  return configProps;
}

function getUserLambdaConfig() {
  try {
    const config: projConfig = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'airfn.json'), 'utf-8')
    );
    return config;
  } catch (err) {
    console.log(`❌   No Airfn config found. Did you first run 'l9 init'?`);
    process.exit(1);
  }
}

function removeDir(dir: string) {
  const list = fs.readdirSync(dir);
  for(let i = 0; i < list.length; i++) {
      const filename = path.join(dir, list[i]);
      const stat = fs.statSync(filename);
      if (stat.isDirectory()) {
          removeDir(filename);
      } else {
          fs.unlinkSync(filename);
      }
  }
  fs.rmdirSync(dir);
}

