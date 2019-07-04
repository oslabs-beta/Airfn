import program from 'commander';
import fs from 'fs';
import path from 'path';
import { run, watch } from '../build/build';
import listen from '../serve/serve';
import ora from 'ora';
import cliSpinners from 'cli-spinners';
import chalk from 'chalk';

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
      spinner.color = 'green';
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
        console.log(chalk.hex('#FF0000')('!!!!SADFASDFASDFASDFASDFASDFADSFAD'))

        if (err) {
          console.error(err);
          return;
        }
        console.log(chalk.hex('#24c4f4')(stats.toString()));
        if (!server) {
          startServer();
          console.log('✅  Done serving!');
        }
      });
      spinner.stop();
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
          console.log('✅  Done building!');
        })
        .catch(function (err: Error) {
          console.error(err);
          process.exit(1);
        });
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
