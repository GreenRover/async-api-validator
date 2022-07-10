import * as AsyncAPIParser from '@asyncapi/parser';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

import * as asyncApim230Schema from '../schemas/asyncapi_2.3.0_schema.json';

import { ValidationResult } from '../controllers/validationResults';

const DEFAULT_SCHEMA = 'http://asyncapi.com/definitions/2.3.0/schema.json';

export class AsyncApiValidator {

    public supportJsonschema2pojo = false;
    public checkHavingExamples = false;
    public checkHavingDescription = false;

    public constructor() {
        this.ajv = new Ajv({
            allErrors: true,
            strictNumbers: true,
            strictSchema: true,
            validateSchema: true,
            removeAdditional: false,
            allowUnionTypes: true,
        });

        addFormats(this.ajv);

        this.ajv.addSchema(asyncApim230Schema, 'http://asyncapi.com/definitions/2.3.0/schema.json');

        // Add keywords for async api mixed ins.
        this.ajv.addKeyword({
            keyword: 'discriminator',
            type: 'string',
        });
        this.ajv.addKeyword({
            keyword: 'externalDocs',
            metaSchema: {
                type: 'object',
                required: [
                    'url',
                ],
                properties: {
                    description: {
                        type: 'string',
                    },
                    url: {
                        type: 'string',
                        format: 'uri',
                    },
                },
            },
        });
    }

    private ajv: Ajv;

    public async validate(schema: string): Promise<ValidationResult[]> {
        let asyncApiDoc: AsyncAPIParser.AsyncAPIDocument;
        try {
            asyncApiDoc = await AsyncAPIParser.parse(
                schema,
            );
        } catch (err) {
            return [{
                item: 'asyncApi',
                error: this._formatError(err),
            }];
        }

        const results: ValidationResult[] = [];
        for (const channelName of asyncApiDoc.channelNames()) {
            const channel = asyncApiDoc.channel(channelName);

            if (channel.subscribe()) {
                const payload = channel.subscribe().message().payload();
                if (payload) {
                    const schemaIdMsg = this.getSchemaId(payload);
                    results.push(...this.checkJsonSchema(
                        payload,
                        'Schema of ' + (schemaIdMsg || (channelName + ' subscribe message payload')),
                    ));
                }

                if (channel.subscribe().message().headers()) {
                    results.push(...this.checkJsonSchema(
                        channel.subscribe().message().headers(),
                        'Schema of ' + (channelName + ' subscribe message header'),
                    ));
                }
            }

            if (channel.publish()) {
                const payload = channel.publish().message().payload();
                if (payload) {
                    const schemaIdMsg = this.getSchemaId(payload);

                    results.push(...this.checkJsonSchema(
                        payload,
                        'Schema of ' + (schemaIdMsg || (channelName + ' publish message payload')),
                    ));
                }

                if (channel.publish().message().headers()) {
                    results.push(...this.checkJsonSchema(
                        channel.publish().message().headers(),
                        'Schema of ' + (channelName + ' publish message header'),
                    ));
                }
            }
        }

        return results;
    }

    private checkJsonSchema(json: AsyncAPIParser.Schema, title: string) {
        const results: ValidationResult[] = [];

        try {
            this.ajv.compile(
                this.normalizeSchema(json.json()),
            );

            if (this.checkHavingExamples) {
                results.push(...this.checkExamples(json, title + ' '));
            }
            if (this.checkHavingDescription) {
                results.push(...this.checkDescription(json, title + ' '));
            }
        } catch (e) {
            results.push({
                item: title,
                error: (e.title || e.message),
                context: JSON.stringify(json.json(), null, 2),
            });
        }

        return results;
    }

    private checkExamples(schema: AsyncAPIParser.Schema, title: string) {
        const results: ValidationResult[] = [];

        let types = schema.type();
        if (!types) {
            types = [];
        } else if (!Array.isArray(types)) {
            types = [types];
        }
        for (const type of types) {
            switch (type.toLowerCase()) {
                case 'string':
                    if (!schema.enum() && !schema.format()) {
                        results.push(...this.checkExampleExists(schema, title));
                    }
                    break;
                case 'integer':
                case 'number':
                    results.push(...this.checkExampleExists(schema, title));
                    break;
                case 'array':
                    if (Array.isArray(schema.items())) {
                        for (const subSchema of schema.items() as AsyncAPIParser.Schema[]) {
                            results.push(...this.checkExamples(subSchema, title + '.items'));
                        }
                    } else {
                        results.push(...this.checkExamples(schema.items() as AsyncAPIParser.Schema, title + '.items'));
                    }
                    break;
                case 'object':
                    if (schema.oneOf() != null) {
                        schema.oneOf().forEach(child => {
                            results.push(...this.checkExamples(child, title + '.oneOf.' + schema.$id));
                        });
                    }
                    if (schema.allOf() != null) {
                        schema.allOf().forEach(child => {
                            results.push(...this.checkExamples(child, title + '.allOf.' + schema.$id));
                        });
                    }
                    if (schema.anyOf() != null) {
                        schema.anyOf().forEach(child => {
                            results.push(...this.checkExamples(child, title + '.anyOf.' + schema.$id));
                        });
                    }

                    for (const [key, value] of Object.entries(schema.properties())) {
                        results.push(...this.checkExamples(value, title + '.properties.' + key));
                    }
                    break;
                case 'boolean':
                case 'null':
                default:
                    // Nothing to check here.
                    break;
            }
        }

        return results;
    }

    private checkExampleExists(schema: AsyncAPIParser.Schema, item: string): ValidationResult[] {
        if (schema.examples()) {
            return [];
        }

        return [
            {
                item: item + '.example',
                error: 'missing example',
                context: JSON.stringify(schema.json(), null, 2),
            },
        ];
    }

    private checkDescription(schema: AsyncAPIParser.Schema, title: string) {
        const results: ValidationResult[] = [];

        let types = schema.type();
        if (!types) {
            types = [];
        } else if (!Array.isArray(types)) {
            types = [types];
        }

        for (const type of types) {
            switch (type.toLowerCase()) {
                case 'array':
                    if (Array.isArray(schema.items())) {
                        results.push(...this.checkDescriptionExists(schema, title));
                        (schema.items() as AsyncAPIParser.Schema[]).forEach((subSchema, i) => {
                            results.push(...this.checkDescription(subSchema, title + '.items[' + i + ']'));
                        });
                    } else {
                        const item = schema.items() as AsyncAPIParser.Schema;
                        if (item.type() && item.type() !== 'object') {
                            results.push(...this.checkDescriptionExists(schema, title));
                        }
                        results.push(...this.checkDescription(item, title + '.items'));
                    }
                    break;
                case 'object':
                    if (schema.oneOf() != null) {
                        schema.oneOf().forEach((child, i) => {
                            results.push(...this.checkDescription(child, title + '.oneOf[' + i + ']'));
                        });
                    }
                    if (schema.allOf() != null) {
                        schema.allOf().forEach((child, i) => {
                            results.push(...this.checkDescription(child, title + '.allOf[' + i + ']'));
                        });
                    }
                    if (schema.anyOf() != null) {
                        schema.anyOf().forEach((child, i) => {
                            results.push(...this.checkDescription(child, title + '.anyOf[' + i + ']'));
                        });
                    }

                    if (schema.properties()) {
                        results.push(...this.checkDescriptionExists(schema, title));
                    }
                    for (const [key, value] of Object.entries(schema.properties())) {
                        results.push(...this.checkDescription(value, title + '.properties.' + key));
                    }
                    break;
                case 'string':
                case 'integer':
                case 'number':
                case 'boolean':
                case 'null':
                default:
                    results.push(...this.checkDescriptionExists(schema, title));
                    break;
            }
        }

        return results;
    }

    private checkDescriptionExists(schema: AsyncAPIParser.Schema, item: string): ValidationResult[] {
        if (schema.description()) {
            return [];
        }

        return [
            {
                item: item + '.description',
                error: 'missing description',
                context: JSON.stringify(schema.json(), null, 2),
            },
        ];
    }

    private _formatError(err) {
        const title = err.title || err.message;
        let details = 'Error Details: ';
        details += err.detail ? err.detail : '';
        if (err.validationErrors && err.validationErrors.length) {
            err.validationErrors.forEach(element => {
                details += '\n\t' + (element.title ? element.title : '');
            });
        }
        return `${title}\n${details}`;
    }

    private normalizeSchema(json: any): any {
        this.stripAsyncApiXKeywords(json);

        if (this.supportJsonschema2pojo) {
            this.stripJsonschema2pojoKeywords(json); // https://www.jsonschema2pojo.org/
        }


        json.$schema = DEFAULT_SCHEMA;
        return json;
    }

    private stripAsyncApiXKeywords(json: any): any {
        if (json === undefined || json === null) {
            return;
        }
        for (const [key, value] of Object.entries(json)) {
            if (key === 'x-parser-spec-parsed' ||
                key === 'x-parser-message-name' ||
                key === 'x-parser-schema-id' ||
                key === 'x-parser-circular' ||
                key === 'x-parser-circular-props') {
                delete json[key];
            } else if (Array.isArray(value)) {
                for (const val of value) {
                    if (typeof val === 'object') {
                        this.stripAsyncApiXKeywords(val);
                    }
                }
            } else if (typeof value === 'object') {
                this.stripAsyncApiXKeywords(value);
            }
        }
    }

    private stripJsonschema2pojoKeywords(json: any): any {
        if (json === undefined || json === null) {
            return;
        }
        for (const [key, value] of Object.entries(json)) {
            if (key === 'javaType' ||
                key === 'existingJavaType' ||
                key === 'javaEnumNames' ||
                key === 'javaEnums' ||
                key === 'javaJsonView' ||
                key === 'javaName' ||
                key === 'javaInterfaces' ||
                key === 'customTimezone' ||
                key === 'customDateTimePattern' ||
                key === 'excludedFromEqualsAndHashCode') {
                delete json[key];
            } else if (Array.isArray(value)) {
                for (const val of value) {
                    if (typeof val === 'object') {
                        this.stripJsonschema2pojoKeywords(val);
                    }
                }
            } else if (typeof value === 'object') {
                this.stripJsonschema2pojoKeywords(value);
            }
        }
    }

    private getSchemaId(payload: AsyncAPIParser.Schema): string {
        const schemaId = payload.json('x-parser-schema-id');

        if (schemaId && schemaId.indexOf('anonymous-schema')) {
            return undefined;
        }

        return schemaId;
    }
}
