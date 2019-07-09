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
const inquirer_1 = __importDefault(require("inquirer"));
let l9config = {};
(function init() {
    return __awaiter(this, void 0, void 0, function* () {
        yield inquirer_1.default
            .prompt([
            {
                name: 'functionsSrc',
                message: 'In which directory are your lambda functions?',
                default: 'src/functions',
            },
        ])
            .then((answers) => {
            l9config.functionsSrc = answers.functionsSrc;
        });
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
            console.log('💾   Your Lambda 9 config has been saved!');
        });
    });
})();
