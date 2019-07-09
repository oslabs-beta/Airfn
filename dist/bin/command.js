#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const commander_1 = __importDefault(require("commander"));
const inquirer_1 = __importDefault(require("inquirer"));
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
const serve_1 = __importDefault(require("../lib/serve/serve"));
const build_1 = require("../lib/build/build");
const deploy_1 = __importDefault(require("../lib/deploy/deploy"));
// TODO allow custom configuration of API Gateway subdomain
const BASE_API_GATEWAY_URL = 'https://test.lambda9.cloud/';
const SPINNER_TIMEOUT = 1000;
const JSONpackage = JSON.parse(fs_1.default.readFileSync(path_1.default.join(__dirname, '..', '..', 'package.json')));
commander_1.default.version(JSONpackage.version);
commander_1.default
    .command('init')
    .description('initialize configuration for serving, building, and deploying lambda functions')
    .action(() => __awaiter(this, void 0, void 0, function* () {
    const l9config = {};
    yield inquirer_1.default
        .prompt([
        {
            name: 'functionsSrc',
            message: 'In which directory are your lambda functions?',
            default: 'src/functions',
        },
    ])
        .then((answers) => __awaiter(this, void 0, void 0, function* () {
        const functionsSrc = answers.functionsSrc;
        l9config.functionsSrc = functionsSrc;
        if (!fs_1.default.existsSync(answers.functionsSrc)) {
            yield inquirer_1.default
                .prompt([
                {
                    type: 'confirm',
                    name: 'createSrcDir',
                    message: `There's no directory at ${answers.functionsSrc}. Would you like to create one now?`,
                },
            ])
                .then((answers) => {
                if (answers.createSrcDir === true && functionsSrc) {
                    fs_1.default.mkdirSync(path_1.default.join(process.cwd(), functionsSrc), {
                        recursive: true,
                    });
                }
            });
        }
    }));
    yield inquirer_1.default
        .prompt([
        {
            name: 'functionsOutput',
            message: 'In which directory would you like your built lambda functions? (a root level directory is recommended)',
            default: '/functions',
        },
    ])
        .then((answers) => {
        l9config.functionsOutput = answers.functionsOutput;
    });
    yield inquirer_1.default
        .prompt([
        {
            type: 'list',
            name: 'nodeRuntime',
            message: 'Which NodeJS runtime will your lambda functions use?',
            choices: ['10.15', '8.10'],
        },
    ])
        .then((answers) => {
        l9config.nodeRuntime = answers.nodeRuntime;
    });
    yield inquirer_1.default
        .prompt([
        {
            name: 'functionsOutput',
            message: 'On which local port do you want to serve your lambda functions?',
            default: '9000',
        },
    ])
        .then((answers) => {
        l9config.port = Number(answers.functionsOutput);
    });
    fs_1.default.writeFile('l9config.json', JSON.stringify(l9config), err => {
        if (err)
            console.log(`😓    Failed to build config: ${err}`);
        console.log('\n💾   Your Lambda 9 config has been saved!');
    });
}));
commander_1.default
    .command('serve')
    .description('serve and watch functions')
    .action(() => {
    const l9config = getUserLambdaConfig();
    const spinner = ora_1.default('🐑  Lambda 9: Serving functions...').start();
    setTimeout(() => {
        const useStatic = Boolean(commander_1.default.static);
        let server;
        const startServer = () => {
            server = serve_1.default(l9config.functionsOutput, l9config.port || 9000, useStatic, Number(commander_1.default.timeout) || 10);
        };
        if (useStatic) {
            startServer();
            return;
        }
        const { config: userWebpackConfig, babelrc: useBabelrc = true } = commander_1.default;
        build_1.watch(l9config.functionsSrc, l9config.functionsOutput, l9config.nodeRuntime, { userWebpackConfig, useBabelrc }, (err, stats) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log(chalk_1.default.hex('#24c4f4')(stats.toString()));
            spinner.stop();
            if (!server) {
                startServer();
                console.log('\n✅  Done serving!');
            }
            else {
                console.log('\n🔨  Done rebuilding!');
            }
            stats.compilation.chunks.forEach((chunk) => {
                server.clearCache(chunk.name || chunk.id().toString());
            });
        });
    }, SPINNER_TIMEOUT);
});
commander_1.default
    .command('build')
    .description('build functions')
    .action(() => {
    const spinner = ora_1.default('🐑  Lambda 9: Building functions...').start();
    setTimeout(() => {
        const l9config = getUserLambdaConfig();
        spinner.color = 'green';
        const { config: userWebpackConfig, babelrc: useBabelrc = true } = commander_1.default;
        build_1.run(l9config.functionsSrc, l9config.functionsOutput, l9config.nodeRuntime, {
            userWebpackConfig,
            useBabelrc,
        })
            .then((stats) => {
            console.log(chalk_1.default.hex('#f496f4')(stats.toString()));
            spinner.stop();
            console.log('\n✅  Done building!');
        })
            .catch((err) => {
            console.error(err);
            process.exit(1);
        });
    }, SPINNER_TIMEOUT);
});
commander_1.default
    .command('deploy')
    .description('deploys functions to aws')
    .action(() => {
    const l9config = getUserLambdaConfig();
    const spinner = ora_1.default('🐑  Lambda 9: Deploying functions...').start();
    setTimeout(() => {
        const { config: userWebpackConfig, babelrc: useBabelrc = true } = commander_1.default;
        // TODO: Handle already built functions
        build_1.run(l9config.functionsSrc, l9config.functionsOutput, l9config.nodeRuntime, { userWebpackConfig, useBabelrc })
            .then((stats) => {
            console.log(chalk_1.default.hex('#f496f4')(stats.toString()));
            deploy_1.default()
                .then((result) => {
                // TODO: Give lambda endpoints to user
                spinner.stop();
                console.log(`\n🚀   Successfully deployed! ${result.data}`);
                console.log(`\n🔗   Lambda endpoints:`);
                result.endpoints.forEach((endpoint) => {
                    console.log(BASE_API_GATEWAY_URL + endpoint);
                });
            })
                .catch(err => {
                spinner.stop();
                console.log(`😓   Failed to deploy: ${err}`);
            });
        })
            .catch((err) => {
            console.error(err);
            process.exit(1);
        });
    }, SPINNER_TIMEOUT);
});
commander_1.default.on('command:*', function () {
    console.error(`\n❌  "${commander_1.default.args.join(' ')}" command not found!`);
    process.exit(1);
});
commander_1.default.parse(process.argv);
const NO_COMMAND_SPECIFIED = commander_1.default.args.length === 0;
if (NO_COMMAND_SPECIFIED) {
    commander_1.default.help();
}
function getUserLambdaConfig() {
    try {
        const config = JSON.parse(fs_1.default.readFileSync(path_1.default.join(process.cwd(), 'l9config.json'), 'utf-8'));
        return config;
    }
    catch (err) {
        console.log(`❌   No Lambda 9 config found. Did you first run 'l9 init'?`);
        process.exit(1);
    }
}
