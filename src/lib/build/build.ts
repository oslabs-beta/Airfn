import path from 'path';
import fs from 'fs';
import webpack from 'webpack';
import build from './buildController';
const createWebpack = build(path, fs, webpack);

function run(
  srcDir: string | void,
  outputDir: string | void,
  runtime: string | void,
  additionalConfig: object
) {
  return new Promise((resolve, reject) => {
    webpack(
      createWebpack(srcDir, outputDir, runtime, additionalConfig),
      (err, stats) => {
        if (err) {
          return reject(err);
        }
        resolve(stats);
      }
    );
  });
}

function watch(
  srcDir: string | void,
  outputDir: string | void,
  runtime: string | void,
  additionalConfig: object,
  cb: webpack.ICompiler.Handler
) {
  var compiler = webpack(
    createWebpack(srcDir, outputDir, runtime, additionalConfig)
  );
  compiler.watch(
    createWebpack(srcDir, outputDir, runtime, additionalConfig),
    cb
  );
}

export { run, watch };
