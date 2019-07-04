import express from 'express';
import serve from './serveController';
import path from 'path';
import queryString from 'querystring';
import bodyParser from 'body-parser';
const createHandler = serve(path, queryString);

import chalk from 'chalk';

function listen(port: number, useStatic: boolean, timeout: number) {
  const app: express.Application = express();
  const DEFAULT_DIR: string = 'functions';
  const PORT = 9000;
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.get('/favicon.ico', function (req, res) {
    return res.status(204).end();
  });

  app.all('*', createHandler(DEFAULT_DIR, false, 10), (req, res) => {
    return res.end();
  });

  app.listen(PORT, () => {
    console.log(chalk.green(`Example app listening on port ${PORT}!`));
  });

  app.get('/favicon.ico', function (req, res) {
    res.status(204).end();
  });
}
export default listen;
