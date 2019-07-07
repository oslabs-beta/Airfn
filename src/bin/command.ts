import program from 'commander';
import fs from 'fs';
import path from 'path';
import { run, watch } from '../build/build';
import listen from '../serve/serve';
import ora from 'ora';
import cliSpinners from 'cli-spinners';
import chalk from 'chalk';
import axios from 'axios';
import yaml from 'js-yaml'

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

const stringToBoolean = (val: string) => {
  if (val === 'true' || val === 'false') {
    return val === 'true';
  } else {
    throw Error(`val must be a string boolean: ${val}`);
  }
};

program
  .command('serve <dir>')
  .description('serve and watch functions')
  .action(function (cmd) {
    const spinner = ora('🐑  lambda9: Starting server').start();
    setTimeout(() => {
      // spinner.color = 'red';
      const useStatic = Boolean(program.static);
      let server: undefined | void;
      const startServer = function () {
        server = listen(
          program.port || 9000,
          useStatic,
          Number(program.timeout) || 10
        );
      };
      if (useStatic) {
        startServer();
        return;
      }
      const { config: userWebpackConfig, babelrc: useBabelrc = true } = program;
      watch(cmd, { userWebpackConfig, useBabelrc }, function (err, stats) {
        // console.log(chalk.hex('#FF0000')('!!!!SADFASDFASDFASDFASDFASDFADSFAD'))

        if (err) {
          console.error(err);
          return;
        }
        console.log(chalk.hex('#24c4f4')(stats.toString()));
        spinner.stop();
        if (!server) {
          startServer();
          console.log('✅  Done serving!');
        }
      });
    }, SPINNER_TIMEOUT);
  });

program
  .command('build <dir>')
  .description('build functions')
  .action(function (cmd) {
    const spinner = ora('🐑  lambda9: Building functions').start();
    setTimeout(() => {
      spinner.color = 'green';
      const { config: userWebpackConfig, babelrc: useBabelrc = true } = program;
      run(cmd, { userWebpackConfig, useBabelrc })
        .then(function (stats: any) {
          console.log(chalk.hex('#f496f4')(stats.toString()));
          spinner.stop();
          console.log('✅  Done building!');
        })
        .catch(function (err: Error) {
          console.error(err);
          process.exit(1);
        });
    }, SPINNER_TIMEOUT);
  });

program
  .command('deploy <dir>')
  .description('deploys functions to aws')
  .action(function (cmd) {
    const spinner = ora('🐑  lambda9: Building functions').start();
    setTimeout(() => {

      //build the functions
      const { config: userWebpackConfig, babelrc: useBabelrc = true } = program;
      run(cmd, { userWebpackConfig, useBabelrc })
        .then(function (stats: any) {
          console.log(chalk.hex('#f496f4')(stats.toString()));
          spinner.stop();
        })
        .catch(function (err: Error) {
          console.error(err);
          process.exit(1);
        });

      //construct yaml file to send
      const yamlConfig: any = {
        AWSTemplateFormatVersion: '2010-09-09',
        Transform: 'AWS::Serverless-2016-10-31',
        Description: 'A simple hello world function.',
        Resources: {}
      }

      //add yaml sections to yaml file
      const createYamlSection = (fileName: any) => {
        fileName = fileName.replace(/\.[^/.]+$/, "")
        const funcTemplate: any = {
          Type: 'AWS::Serverless::Function',
          Properties: {
            Handler: `${fileName}.handler`,
            Runtime: 'nodejs8.10',
            CodeUri: '.',
            Description: 'A simple hello world function.',
            MemorySize: 512,
            Timeout: 10,
            Events: {
              Api1: {
                Type: "Api",
                Properties: {
                  Path: `/${fileName}`,
                  Method: 'ANY'
                }
              }
            }
          }
        }

        yamlConfig.Resources[fileName] = funcTemplate
      }
      //********send built func strings  to some endpoint**********************
      const funcArr: any = []

      fs.readdirSync(path.join(process.cwd(), `/functions`)).forEach(file => {
        createYamlSection(file)
        const data = fs.readFileSync(path.join(process.cwd(), `/functions/${file}`), 'utf8')
        const funcObj: object = {
          funcName: file,
          funcDef: data
        }
        funcArr.push(funcObj)
      });

      axios.post('http://api.lambda9.cloud/lambda/deploy', {
        funcArr: funcArr,
        yaml: yaml.safeDump(yamlConfig)
      })
        .then((response) => {
          console.log(response.data);
        })
        .catch((error) => {
          console.log(error);
        })

      // fs.writeFile(`testYaml.yaml`, yaml.safeDump(yamlConfig), (err) => {
      //   if (err) console.log(err)


      //stop spinner
      spinner.stop();
    }, SPINNER_TIMEOUT);
  });

program.on('command:*', function () {
  console.error(`❌  "${program.args.join(' ')}" command not found!`);
  process.exit(1);
});

program.parse(process.argv);

const NO_COMMAND_SPECIFIED = program.args.length === 0;

if (NO_COMMAND_SPECIFIED) {
  program.help();
}
