import express from 'express';
import serve from './serveController';
import path from 'path';
import queryString from 'querystring';
import bodyParser from 'body-parser';
const createHandler = serve(path, queryString);
import { run, watch } from '../build/build';

const app: express.Application = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const DEFAULT_DIR: string = 'functions';
const PORT = 9000;

const dummyConfigs = {
  userWebpackConfig: true,
  userBabelrc: true,
};

//run
run('functions', dummyConfigs)
  .then(function (stats: any) {
    console.log(stats.toString({ color: true }));
  })
  .catch(function (err: any) {
    console.error(err);
    process.exit(1);
  });

//watch
watch('functions', dummyConfigs, function (err, stats) {
  if (err) {
    console.error(err);
    return;
  }

  console.log(stats.toString());
  console.log('\x1b[34m%s\x1b[0m', 'Functions built!');

  //TODO: set server stuff
  // stats.compilation.chunks.forEach(function (chunk) {
  //   server.clearCache(chunk.name || chunk.id.toString());
  // });
});

app.get('/favicon.ico', function (req, res) {
  return res.status(204).end();
});

app.all('*', createHandler(DEFAULT_DIR, false, 10), (req, res) => {
  return res.end();
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
