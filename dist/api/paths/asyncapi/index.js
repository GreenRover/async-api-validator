"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
exports.POST = [
    /* business middleware not expressible by OpenAPI documentation goes here */
    (req, res, next) => {
        res.status(200).json( /* return the user */);
    }
];
exports.POST.apiDoc = {
    description: 'Validate a async api schema.',
    tags: ['asyncApi'],
    operationId: 'validateAsyncApi',
    // parameters for this operation
    parameters: [
        {
            in: 'query',
            name: 'ignoreXxx',
            type: 'boolean'
        }
    ],
    responses: {
        default: {
            $ref: '#/definitions/Error'
        }
    }
};
//# sourceMappingURL=index.js.map