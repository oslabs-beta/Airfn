const YAML_CONFIG_TEMPLATE: config = {
  AWSTemplateFormatVersion: '2010-09-09',
  Transform: 'AWS::Serverless-2016-10-31',
  Description: 'Deployed with Lambda 9 CLI.',
  Resources: {},
};

interface config {
  AWSTemplateFormatVersion: string;
  Transform: string;
  Description: string;
  Resources: object;
}

export default (
  join: Function,
  fs: { readFileSync: Function; readdirSync: Function },
  safeDump: Function
) => {
  const funcArr: any = [];
  const yamlConfig: config = YAML_CONFIG_TEMPLATE;

  fs.readdirSync(join(process.cwd(), `/functions`)).forEach((file: string) => {
    createFunctionResource(file, yamlConfig);
    const data = fs.readFileSync(
      join(process.cwd(), `/functions/${file}`),
      'utf8'
    );
    const funcObj: object = {
      funcName: file,
      funcDef: data,
    };
    funcArr.push(funcObj);
  });
  return {
    yaml: safeDump(yamlConfig),
    funcArr,
  };
};

function createFunctionResource(fileName: string, yamlConfig: any): void {
  fileName = fileName.replace(/\.[^/.]+$/, '');
  const funcTemplate: object = {
    Type: 'AWS::Serverless::Function',
    Properties: {
      Handler: `${fileName}.handler`,
      Runtime: 'nodejs8.10',
      CodeUri: '.',
      Description: 'A function deployed with Lambda 9 CLI',
      MemorySize: 512,
      Timeout: 10,
      Events: {
        Api1: {
          Type: 'Api',
          Properties: {
            Path: `/${fileName}`.toLowerCase(),
            Method: 'ANY',
          },
        },
      },
    },
  };
  yamlConfig.Resources[fileName] = funcTemplate;
}
