import fs from 'fs';
import path from 'path';
import webpack from 'webpack';

const USER_FUNCTONS_DIR_NAME = 'functions';

const testFilePattern = '\\.(test|spec)\\.?';
interface babelOptsObj {
  cacheDirectory: boolean;
  presets: any[];
  plugins: any[];
}
interface entryInterface {
  [key: string]: any;
}

function createWebpackConfig(
  dir: string,
  { userWebpackConfig, useBabelrc }: any = {}
) {
  const babelOpts: babelOptsObj = {
    cacheDirectory: true,
    presets: [
      [
        require.resolve('@babel/preset-env'),
        { targets: { node: getBabelTarget({}) } }
      ]
    ],
    plugins: [
      require.resolve('@babel/plugin-proposal-class-properties'),
      require.resolve('@babel/plugin-transform-object-assign'),
      require.resolve('@babel/plugin-proposal-object-rest-spread')
    ]
  };

  const functionsDir = USER_FUNCTONS_DIR_NAME;
  const functionsPath = path.join(process.cwd(), functionsDir);
  const dirPath = path.join(process.cwd(), dir);

  const defineEnv = {};
  const nodeEnv = process.env.NODE_ENV || 'production';

  const webpackMode = ['production', 'development'].includes(nodeEnv)
    ? nodeEnv
    : 'none';

  const webpackConfig: any = {
    mode: webpackMode,
    resolve: {
      extensions: ['.wasm', '.mjs', '.js', '.json', '.ts'],
      mainFields: ['module', 'main']
    },
    module: {
      rules: [
        {
          test: /\.(m?js|ts)?$/,
          exclude: new RegExp(
            `(node_modules|bower_components|${testFilePattern})`
          ),
          use: {
            loader: require.resolve('babel-loader'),
            options: { ...babelOpts, babelrc: useBabelrc }
          }
        }
      ]
    },
    context: dirPath,
    entry: {},
    target: 'node',
    plugins: [
      new webpack.IgnorePlugin(/vertx/),
      new webpack.DefinePlugin(defineEnv)
    ],
    output: {
      path: functionsPath,
      filename: '[name].js',
      libraryTarget: 'commonjs'
    },
    optimization: {
      nodeEnv
    },
    bail: true,
    devtool: false
  };

  fs.readdirSync(dirPath).forEach(file => {
    if (file.match(/\.(m?js|ts)$/)) {
      var name = file.replace(/\.(m?js|ts)$/, '');
      if (!name.match(new RegExp(testFilePattern))) {
        webpackConfig.entry[name] = './' + file;
      }
    }
  });

  return webpackConfig;
}

function getBabelTarget(envConfig: any) {
  const key = 'AWS_LAMBDA_JS_RUNTIME';
  const runtimes = ['nodejs8.15.0', 'nodejs6.10.3'];
  const current = envConfig[key] || process.env[key] || 'nodejs8.15.0';
  const unknown = runtimes.indexOf(current) === -1;
  return unknown ? '8.15.0' : current.replace(/^nodejs/, '');
}

function run(dir: string, additionalConfig: object) {
  return new Promise((resolve, reject) => {
    webpack(createWebpackConfig(dir, additionalConfig), (err, stats) => {
      if (err) {
        return reject(err);
      }
      resolve(stats);
    });
  });
}

function watch(
  dir: string,
  additionalConfig: object,
  cb: webpack.ICompiler.Handler
) {
  var compiler = webpack(createWebpackConfig(dir, additionalConfig));
  compiler.watch(createWebpackConfig(dir, additionalConfig), cb);
}

export { run, watch };
