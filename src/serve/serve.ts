import express from 'express';
import serve from './serveController';
import path from 'path';
import queryString from 'querystring';
import bodyParser from 'body-parser';
const createHandler = serve(path, queryString);
import run from '../build/build';

const app: express.Application = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const DEFAULT_DIR: string = 'functions';
const PORT = 9000;

const dummyConfigs = {
  userWebpackConfig: true,
  userBabelrc: true,
};
run('functions', dummyConfigs)
  .then(function(stats: any) {
    console.log(stats.toString({ color: true }));
  })
  .catch(function(err: any) {
    console.error(err);
    process.exit(1);
  });

app.get('/favicon.ico', function(req, res) {
  return res.status(204).end();
});

app.all('*', createHandler(DEFAULT_DIR, false, 10), (req, res) => {
  return res.end();
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
