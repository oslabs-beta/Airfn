"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const webpack_1 = __importDefault(require("webpack"));
const buildController_1 = __importDefault(require("./buildController"));
const createWebpack = buildController_1.default(path_1.default, fs_1.default, webpack_1.default);
function run(srcDir, outputDir, runtime, additionalConfig) {
    return new Promise((resolve, reject) => {
        webpack_1.default(createWebpack(srcDir, outputDir, runtime, additionalConfig), (err, stats) => {
            if (err) {
                return reject(err);
            }
            resolve(stats);
        });
    });
}
exports.run = run;
function watch(srcDir, outputDir, runtime, additionalConfig, cb) {
    var compiler = webpack_1.default(createWebpack(srcDir, outputDir, runtime, additionalConfig));
    compiler.watch(createWebpack(srcDir, outputDir, runtime, additionalConfig), cb);
}
exports.watch = watch;
