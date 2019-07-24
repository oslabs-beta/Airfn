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
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const commander_1 = __importDefault(require("commander"));
const inquirer_1 = __importDefault(require("inquirer"));
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
const axios_1 = __importDefault(require("axios"));
const serve_1 = __importDefault(require("../lib/serve/serve"));
const build_1 = require("../lib/build/build");
const deploy_1 = __importDefault(require("../lib/deploy/deploy"));
// TODO allow custom configuration of API Gateway subdomain
const ROOT_CONFIG_FILENAME = 'config.json';
const ROOT_CONFIG_DIRNAME = '.airfn';
const BASE_API_GATEWAY_ENDPOINT = 'lambda9.cloud';
const AUTH_ENDPOINT = 'https://test.lambda9.cloud/cli/cliauth';
const SPINNER_TIMEOUT = 1000;
const JSONpackage = JSON.parse(fs_1.default.readFileSync(path_1.default.join(__dirname, '..', '..', 'package.json')));
commander_1.default.version(JSONpackage.version);
commander_1.default
    .command('init')
    .description('Initialize configuration for serving, building, and deploying lambda functions')
    .action(() => __awaiter(this, void 0, void 0, function* () {
    const airfnConfig = {};
    const cwdName = path_1.default.parse(process.cwd()).name;
    console.log(`\n👤 Please login with your username and password\nYou can sign up for an account at https://airfn.io/signup\n`);
    // TODO: Implement actual auth
    yield inquirer_1.default
        .prompt([
        {
            name: 'username',
            message: 'Username:',
        },
    ])
        .then((answers) => __awaiter(this, void 0, void 0, function* () {
        const username = answers.username;
        airfnConfig.user = answers.username;
        yield inquirer_1.default
            .prompt([
            {
                name: 'password',
                type: 'password',
                message: 'Password:',
            },
        ])
            .then((answers) => __awaiter(this, void 0, void 0, function* () {
            const password = answers.password;
            const credentials = {
                username,
                password
            };
            yield axios_1.default.post(AUTH_ENDPOINT, credentials).then((response) => {
                const homedir = os_1.default.homedir();
                const rootConfigDir = path_1.default.join(homedir, ROOT_CONFIG_DIRNAME);
                const rootConfigPath = path_1.default.join(rootConfigDir, ROOT_CONFIG_FILENAME);
                const rootConfig = {
                    clientId: response.data
                };
                if (!fs_1.default.existsSync(rootConfigDir)) {
                    fs_1.default.mkdir(rootConfigDir, (err) => {
                        if (err)
                            console.log(`😓    Failed to build config: ${err}`);
                    });
                }
                fs_1.default.writeFile(rootConfigPath, JSON.stringify(rootConfig), err => {
                    if (err)
                        console.log(`😓    Failed to build config: ${err}`);
                });
            }).catch((err) => {
                console.log(`❌ Wrong username/password combination.\n Retry by running 'air init' again`);
                process.exit();
            });
        }));
    }));
    yield inquirer_1.default
        .prompt([
        {
            name: 'project',
            message: 'Enter project name for your lambda functions:',
            default: cwdName,
        },
    ])
        .then((answers) => {
        airfnConfig.project = answers.project;
    });
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
        airfnConfig.functionsSrc = functionsSrc;
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
        airfnConfig.functionsOutput = answers.functionsOutput;
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
        airfnConfig.nodeRuntime = answers.nodeRuntime;
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
        airfnConfig.port = Number(answers.functionsOutput);
    });
    fs_1.default.writeFile('airfn.json', JSON.stringify(airfnConfig), err => {
        if (err)
            console.log(`😓    Failed to build config: ${err}`);
        console.log('\n💾   Your Airfn config has been saved!');
    });
}));
commander_1.default
    .command('serve')
    .description('Serve and watch functions')
    .action(() => {
    getUserAccessKey();
    const airfnConfig = getUserLambdaConfig();
    const spinner = ora_1.default('☁️   Airfn: Serving functions...').start();
    setTimeout(() => {
        const useStatic = Boolean(commander_1.default.static);
        let server;
        const startServer = () => {
            server = serve_1.default(airfnConfig.functionsOutput, airfnConfig.port || 9000, useStatic, Number(commander_1.default.timeout) || 10);
        };
        if (useStatic) {
            startServer();
            return;
        }
        const { config: userWebpackConfig, babelrc: useBabelrc = true } = commander_1.default;
        build_1.watch(airfnConfig.functionsSrc, airfnConfig.functionsOutput, airfnConfig.nodeRuntime, { userWebpackConfig, useBabelrc }, (err, stats) => {
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
    .description('Build functions')
    .action(() => {
    getUserAccessKey();
    const spinner = ora_1.default('☁️   Airfn: Building functions...').start();
    setTimeout(() => {
        const airfnConfig = getUserLambdaConfig();
        spinner.color = 'green';
        const { config: userWebpackConfig, babelrc: useBabelrc = true } = commander_1.default;
        build_1.run(airfnConfig.functionsSrc, airfnConfig.functionsOutput, airfnConfig.nodeRuntime, {
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
    .description('Deploys functions to AWS')
    .action(() => {
    const accessKey = getUserAccessKey();
    const airfnConfig = getUserLambdaConfig();
    const spinner = ora_1.default('☁️   Airfn: Deploying functions...').start();
    setTimeout(() => {
        const { config: userWebpackConfig, babelrc: useBabelrc = true } = commander_1.default;
        // TODO: Handle already built functions
        build_1.run(airfnConfig.functionsSrc, airfnConfig.functionsOutput, airfnConfig.nodeRuntime, { userWebpackConfig, useBabelrc })
            .then((stats) => {
            console.log(chalk_1.default.hex('#f496f4')(stats.toString()));
            deploy_1.default(airfnConfig.user, accessKey, airfnConfig.project, airfnConfig.functionsSrc, airfnConfig.functionsOutput)
                .then((result) => {
                // TODO: Give lambda endpoints to user
                spinner.stop();
                console.log(`\n🚀   Successfully deployed! ${result.data}`);
                console.log(`\n🔗   Lambda endpoints:`);
                result.endpoints.forEach((endpoint) => {
                    console.log(`https://${airfnConfig.project}.${BASE_API_GATEWAY_ENDPOINT}/${endpoint}`);
                });
            })
                .catch((err) => {
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
commander_1.default
    .command('logout')
    .description('Log out of Airfn CLI')
    .action(() => {
    const { configFound, configDir } = rootConfigExists();
    if (configFound) {
        try {
            removeDir(configDir);
            console.log('Logged out of Airfn CLI');
            process.exit(0);
        }
        catch (err) {
            console.error(`Failed to log out`);
        }
    }
    else {
        console.log(`Already logged out`);
        process.exit(1);
    }
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
function getUserAccessKey() {
    const { configFound, configPath } = rootConfigExists();
    if (configFound) {
        try {
            const rootConfig = JSON.parse(fs_1.default.readFileSync(configPath, 'utf-8'));
            return rootConfig.clientId;
        }
        catch (err) {
            console.log(`❌ Error reading config`);
        }
    }
    else {
        console.log(`❗️ Please login first by running 'air init'`);
        process.exit(1);
    }
}
function rootConfigExists() {
    const homedir = os_1.default.homedir();
    const rootConfigDir = path_1.default.join(homedir, ROOT_CONFIG_DIRNAME);
    const rootConfigPath = path_1.default.join(rootConfigDir, ROOT_CONFIG_FILENAME);
    const configFound = fs_1.default.existsSync(rootConfigPath);
    const configProps = {
        configFound: configFound,
        configDir: rootConfigDir,
        configPath: rootConfigPath
    };
    return configProps;
}
function getUserLambdaConfig() {
    try {
        const config = JSON.parse(fs_1.default.readFileSync(path_1.default.join(process.cwd(), 'airfn.json'), 'utf-8'));
        return config;
    }
    catch (err) {
        console.log(`❌   No Airfn config found. Did you first run 'l9 init'?`);
        process.exit(1);
    }
}
function removeDir(dir) {
    const list = fs_1.default.readdirSync(dir);
    for (let i = 0; i < list.length; i++) {
        const filename = path_1.default.join(dir, list[i]);
        const stat = fs_1.default.statSync(filename);
        if (stat.isDirectory()) {
            removeDir(filename);
        }
        else {
            fs_1.default.unlinkSync(filename);
        }
    }
    fs_1.default.rmdirSync(dir);
}
