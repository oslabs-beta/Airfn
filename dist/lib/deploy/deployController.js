"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const YAML_CONFIG_TEMPLATE = {
    AWSTemplateFormatVersion: '2010-09-09',
    Transform: 'AWS::Serverless-2016-10-31',
    Description: 'Deployed with Lambda 9 CLI.',
    Resources: {},
};
exports.default = (join, fs, safeDump) => {
    const funcArr = [];
    const yamlConfig = YAML_CONFIG_TEMPLATE;
    fs.readdirSync(join(process.cwd(), `/functions`)).forEach((file) => {
        createFunctionResource(file, yamlConfig);
        const data = fs.readFileSync(join(process.cwd(), `/functions/${file}`), 'utf8');
        const funcObj = {
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
function createFunctionResource(fileName, yamlConfig) {
    fileName = fileName.replace(/\.[^/.]+$/, '');
    const funcTemplate = {
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
