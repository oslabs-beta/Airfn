import express from 'express';
import serve from './serveController';
import path from 'path';
import queryString from 'querystring';
import bodyParser from 'body-parser';
const createHandler = serve(path, queryString);

import chalk from 'chalk';

function listen(
  src: string | void,
  port: number,
  useStatic: boolean,
  timeout: number
) {
  const app: express.Application = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.get('/favicon.ico', function(req, res) {
    return res.status(204).end();
  });

  app.all('*', createHandler(src, false, 10), (req, res) => {
    return res.end();
  });

  app.listen(port, () => {
    console.log(chalk.green(`Example app listening on port ${port}!`));
  });

   return {
    clearCache: (chunk : any)  => {
      const module = path.join(process.cwd(), String(src), chunk);
      delete require.cache[require.resolve(module)];
    }
  };
}
export default listen;
