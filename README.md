# Airfn

Airfn is a CLI tool that enables users to easily and quickly serve and deploy their AWS lambda functions to AWS with their existing development environment, increasing developer productivity by abstracting configuration process

## How it works

Users (developers) are able to use our CLI to serve functions locally, build functions to
optimize speed and performance, and deploy those functions as serverless Lambdas by
creating an account on the Airfn Web App and doing the following:

* User installs our Node.js CLI globally by running npm install -g airfn in
her terminal.
..* User initializes a configuration file by entering air init in her terminal
within her project directory.

* User serves functions locally as Lambdas by entering air serve.
..* CLI spins up an Express server and serves the user’s functions, using the
names of the functions as the names of the API endpoints. User can now
locally test her Lambdas by sending requests to the endpoints.
* User builds functions for deployment by entering air build.
..* CLI processes user&#39;s functions to transpile functions source code and any
imported Node modules to her chosen Node.js version via Babel.

* User deploys functions to AWS by entering air deploy.

..* CLI gets function source code of user&#39;s functions in string format, along
with a generated YAML template based on the user&#39;s functions containing
configuration for AWS API Gateway and other services, that will be used
to deploy the functions as Lambdas to AWS and later be written to our
AWS DynamoDB database.
○ CLI sends payload of deploy artifacts consisting of functions’ source code,
the YAML configuration, and metadata (i.e. user access key, project
name, etc.) to our Deploy Microservice, a Golang microservice hosted on
AWS EC2. Deploy Microservice receives the payload and spins up a
Docker container that has the functions’ source code and YAML
configuration mapped to its volume drive. Upon build, the container, which
was created from a Docker base image that runs in a Python environment
and has the AWS CLI pre-installed, will run the AWS CLI command that
will package the functions’ source code in a ZIP file and deploy the user&#39;s
functions to AWS on her project’s S3 bucket.
○ Upon deployment the CLI invokes an Airfn Lambda that will map the
users’ deployed functions on AWS API Gateway to a custom domain
configured via AWS Route 53 based on the user’s project name. Another
Airfn Lambda gets invoked to subscribe the function to an AWS Kinesis
Stream that serves to route all logs of users’ functions on AWS
CloudWatch to our DynamoDB database to be later rendered on the Airfn
Web App.

![frontend screenshot](https://s3.amazonaws.com/poly-screenshots.angel.co/Project/20/1013350/954b61538d818b4302bca271bd0e0a6e-original.png)
