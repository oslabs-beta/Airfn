import express from 'express';
import path from 'path';
import queryString from 'querystring';
// Create a new express application instance
const app: express.Application = express();

const DEFAULT_DIR: string = 'functions';

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});

app.all("*", createHandler(DEFAULT_DIR, 10));

function createHandler(dir: string, timeout: number) {
  return function (req: express.Request, res: express.Response, ) {
    //  /Users/bruce/Documents/Code/lambda-example/functions/hello
    const funcName = req.path.split("/").filter(name => name)[0];
    const pathToModule = path.join(process.cwd(), dir, funcName);
    // could have a try/catch here, see netlify-lambda/serve.js
    const handler = require(pathToModule);

    const lambdaRequest = {
      path: req.path,
      httpMethod: req.method,
      queryStringParameters: queryString.parse(req.url.split(/\?(.+)/)[1]),
      headers: req.headers,
      body: req.body
    }

    const promise = handler.handler(lambdaRequest, null, null);
    Promise.all([promise]).then(result => res.send(result))
    // ✅ func path should be the last element of request path
    // ✅ module path should match some pattern
    // ✅ if handler errors out, should have res.locals.errorMessage
    // ✅ res.locals.lambaResponse should be type of response object
    // ✅ res.locals.lambaResponse should have these headers
    // ✅ res.locals.lambaResponse should have this body
    // ✅ res.locals.errorMessage should be XYZ if timeout
    // ❓ mock createCallback function should have been called one time
    // ❓... and with these args
    // ❓ mock handlerPromise function should have been called one
    // ❓... and with these args

  }
}


// function createHandler(dir, static, timeout) {
//   return function (request, response) {
//     // handle proxies without path re-writes (http-servr)
//     var cleanPath = request.path.replace(/^\/.netlify\/functions/, "")

//     var func = cleanPath.split("/").filter(function (e) {
//       return e
//     })[0]
//     var module = path.join(process.cwd(), dir, func)

//     if (static) {
//       delete require.cache[require.resolve(module)]
//     }
//     var handler
//     try {
//       handler = require(module)
//     } catch (err) {
//       handleErr(err, response)
//       return
//     }

//     var isBase64 =
//       request.body &&
//       !(request.headers["content-type"] || "").match(
//         /text|application|multipart\/form-data/
//       )
//     var lambdaRequest = {
//       path: request.path,
//       httpMethod: request.method,
//       queryStringParameters: queryString.parse(request.url.split(/\?(.+)/)[1]),
//       headers: request.headers,
//       body: isBase64
//         ? Buffer.from(request.body.toString(), "utf8").toString("base64")
//         : request.body,
//       isBase64Encoded: isBase64,
//     }

//     var callback = createCallback(response)

//     var promise = handler.handler(
//       lambdaRequest,
//       { clientContext: buildClientContext(request.headers) || {} },
//       callback
//     )

//     var invocationTimeoutRef = null

//     Promise.race([
//       promiseCallback(promise, callback),
//       new Promise(function (resolve) {
//         invocationTimeoutRef = setTimeout(function () {
//           handleInvocationTimeout(response, timeout)
//           resolve()
//         }, timeout * 1000)
//       }),
//     ]).then(
//       result => {
//         clearTimeout(invocationTimeoutRef)
//         return result // not used, but writing this to avoid future footguns
//       },
//       err => {
//         clearTimeout(invocationTimeoutRef)
//         throw err
//       }
//     )
//   }
// }


// exports.listen = function (port, static, timeout) {
//   var config = conf.load()
//   var app = express()
//   var dir = config.build.functions || config.build.Functions
//   app.use(bodyParser.raw({ limit: "6mb" }))
//   app.use(bodyParser.text({ limit: "6mb", type: "*/*" }))
//   app.use(
//     expressLogging(console, {
//       blacklist: ["/favicon.ico"],
//     })
//   )

//   app.get("/favicon.ico", function (req, res) {
//     res.status(204).end()
//   })
//   app.all("*", createHandler(dir, static, timeout))

//   app.listen(port, function (err) {
//     if (err) {
//       console.error("Unable to start lambda server: ", err)
//       process.exit(1)
//     }

//     console.log(`Lambda server is listening on ${port}`)
//   })

//   return {
//     clearCache: function (chunk) {
//       var module = path.join(process.cwd(), dir, chunk)
//       delete require.cache[require.resolve(module)]
//     },
//   }
// }