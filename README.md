# Airfn

Airfn is a CLI tool that enables users to easily and quickly serve and deploy their AWS lambda functions to AWS with their existing development environment, increasing developer productivity by abstracting configuration process

## How it works

Users (developers) are able to use our CLI to serve functions locally, build functions to
optimize speed and performance, and deploy those functions as serverless Lambdas by
creating an account on the Airfn Web App and doing the following:

* User installs our Node.js CLI globally by running `npm install -g airfn` in terminal.

* User initializes a configuration file by entering `air init` in terminal
within project directory.

* User serves functions locally as Lambdas by entering `air serve`.

    CLI spins up an Express server and serves the user’s functions, using the
names of the functions as the names of the API endpoints. User can now
locally test her Lambdas by sending requests to the endpoints.

* User builds functions for deployment by entering `air build`.

    CLI processes user&#39;s functions to transpile functions source code and any
imported Node modules to her chosen Node.js version via Babel.

* User deploys functions to AWS by entering `air deploy`.
        CLI gets function source code of user's functions that will be used to deploy as Lambdas to AWS and return endpoints.

![frontend screenshot](https://s3.amazonaws.com/poly-screenshots.angel.co/Project/20/1013350/cf509910af7d10a83142fd2d297c2847-original.png)
