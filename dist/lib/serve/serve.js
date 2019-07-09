"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const serveController_1 = __importDefault(require("./serveController"));
const path_1 = __importDefault(require("path"));
const querystring_1 = __importDefault(require("querystring"));
const body_parser_1 = __importDefault(require("body-parser"));
const createHandler = serveController_1.default(path_1.default, querystring_1.default);
const chalk_1 = __importDefault(require("chalk"));
function listen(src, port, useStatic, timeout) {
    const app = express_1.default();
    app.use(body_parser_1.default.json());
    app.use(body_parser_1.default.urlencoded({ extended: true }));
    app.get('/favicon.ico', function (req, res) {
        return res.status(204).end();
    });
    app.all('*', createHandler(src, false, 10), (req, res) => {
        return res.end();
    });
    const server = app.listen(port, () => {
        console.log(chalk_1.default.green(`Example app listening on port ${port}!`));
    });
    app.get('/favicon.ico', function (req, res) {
        res.status(204).end();
    });
    return {
        clearCache: (chunk) => {
            const module = path_1.default.join(process.cwd(), String(src), chunk);
            delete require.cache[require.resolve(module)];
        }
    };
}
exports.default = listen;
