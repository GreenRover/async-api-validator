"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apiDoc = {
    swagger: "2.0",
    basePath: "/",
    info: {
        title: "API validation system",
        version: "1.0.0",
    },
    definitions: {
        AsynApi: {
            type: "object",
            properties: {
                schema: {
                    description: 'The AsyncApi schema',
                    type: 'string'
                }
            },
            required: ["schema"],
        },
    },
    paths: {},
};
exports.default = apiDoc;
//# sourceMappingURL=api-doc.js.map