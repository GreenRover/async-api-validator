"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const express_openapi_1 = require("express-openapi");
const morgan_1 = __importDefault(require("morgan"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
// initialize configuration
dotenv_1.default.config();
// port is now available to the Node.js runtime
// as if it were an environment variable
const port = process.env.SERVER_PORT;
const app = (0, express_1.default)();
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
// OpenAPI routes
(0, express_openapi_1.initialize)({
    apiDoc: './api/api-doc.js',
    app,
    paths: './dist/api/paths',
    routesGlob: '**/*.{ts,js}',
    routesIndexFileRegExp: /(?:index)?\.[tj]s$/
});
// OpenAPI UI
app.use("/docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(null, {
    swaggerOptions: {
        url: `http://localhost:${port}/api-docs`,
    },
}));
// define a route handler for the default home page
app.get("/", (req, res) => {
    res.send("Hello world!");
});
// start the Express server
app.listen(port, () => {
    (0, morgan_1.default)(`server started at http://localhost:${port}`);
    (0, morgan_1.default)(`OpenAPI documentation available in http://localhost:${port}/api-documentation`);
});
//# sourceMappingURL=index.js.map