#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import program from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import listen from '../lib/serve/serve';
import { run, watch } from '../lib/build/build';
import deploy from '../lib/deploy/deploy';
import { projConfig } from '../lib/types';
import { config } from 'rxjs';

// TODO allow custom configuration of API Gateway subdomain
const BASE_API_GATEWAY_URL = 'https://test.lambda9.cloud/';
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
    'initialize configuration for serving, building, and deploying lambda functions'
  )
  .action(async () => {
    const l9config: projConfig = {};
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
        l9config.functionsSrc = functionsSrc;
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
        l9config.functionsOutput = answers.functionsOutput;
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
        l9config.nodeRuntime = answers.nodeRuntime;
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
        l9config.port = Number(answers.functionsOutput);
      });

    fs.writeFile('l9config.json', JSON.stringify(l9config), err => {
      if (err) console.log(`\n😓    Failed to build config: ${err}`);
      console.log('\n💾   Your Lambda 9 config has been saved!');
    });
  });

program
  .command('serve')
  .description('serve and watch functions')
  .action(() => {
    const l9config = getUserLambdaConfig()!;
    const spinner = ora('🐑  Lambda 9: Serving functions...').start();
    setTimeout(() => {
      const useStatic = Boolean(program.static);
      let server: undefined | void;
      const startServer = () => {
        server = listen(
          l9config.functionsOutput,
          l9config.port || 9000,
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
        l9config.functionsSrc,
        l9config.functionsOutput,
        l9config.nodeRuntime,
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

          stats.compilation.chunks.forEach((chunk : any)  => {
            server.clearCache(chunk.name || chunk.id().toString());
          });
        }
      );
    }, SPINNER_TIMEOUT);
  });

program
  .command('build')
  .description('build functions')
  .action(() => {
    const spinner = ora('🐑  Lambda 9: Building functions...').start();
    setTimeout(() => {
      const l9config = getUserLambdaConfig()!;
      spinner.color = 'green';
      const { config: userWebpackConfig, babelrc: useBabelrc = true } = program;
      run(
        l9config.functionsSrc,
        l9config.functionsOutput,
        l9config.nodeRuntime,
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
  .description('deploys functions to aws')
  .action(() => {
    const l9config = getUserLambdaConfig()!;
    const spinner = ora('🐑  Lambda 9: Deploying functions...').start();
    setTimeout(() => {
      const { config: userWebpackConfig, babelrc: useBabelrc = true } = program;
      // TODO: Handle already built functions
      run(
        l9config.functionsSrc,
        l9config.functionsOutput,
        l9config.nodeRuntime,
        { userWebpackConfig, useBabelrc }
      )
        .then((stats: any) => {
          console.log(chalk.hex('#f496f4')(stats.toString()));
          deploy()
            .then((result: any) => {
              // TODO: Give lambda endpoints to user
              spinner.stop();
              console.log(`\n🚀   Successfully deployed! ${result.data}`);
              console.log(`\n🔗   Lambda endpoints:`);
              result.endpoints.forEach((endpoint: string) => {
                console.log(BASE_API_GATEWAY_URL + endpoint);
              });
            })
            .catch(err => {
              spinner.stop();
              console.log(`\n😓 Failed to deploy: ${err}`);
            });
        })
        .catch((err: Error) => {
          console.error(err);
          process.exit(1);
        });
    }, SPINNER_TIMEOUT);
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

function getUserLambdaConfig() {
  try {
    const config: projConfig = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'l9config.json'), 'utf-8')
    );
    return config;
  } catch (err) {
    console.log(`❌   No Lambda 9 config found. Did you first run 'l9 init'?`);
    process.exit(1);
  }
}
