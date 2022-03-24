import * as AsyncAPIParser from '@asyncapi/parser';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { ValidationResult } from '../controllers/validationResults';

export class AsyncApiValidator {

    public supportJsonschema2pojo = false;

    public async validate(schema: string): Promise<ValidationResult | null> {
        const ajv = new Ajv({
            allErrors: true,
            strictNumbers: true,
            strictSchema: true,
            validateSchema: true,
            removeAdditional: false,
        });

        addFormats(ajv);

        let asyncApiDoc;
        try {
            asyncApiDoc = await AsyncAPIParser.parse(
                schema,
            );
        } catch (err) {
            return {
                msg: this._formatError(err),
            };
        }

        for (const channelName of asyncApiDoc.channelNames()) {
            const channel = asyncApiDoc.channel(channelName);

            if (channel.subscribe()) {
                const schemaIdMsg = channel.subscribe().message().payload()._json['x-parser-schema-id'];

                try {
                    ajv.compile(
                        this.normaliseSchema(channel.subscribe().message().payload()._json),
                    );
                } catch (e) {
                    return {
                        msg: 'Schema of ' + (schemaIdMsg || (channelName + ' subscribe message payload')) + '\n' + (e.title || e.message),
                        exception: e,
                        context: channel.subscribe().message().payload()._json,
                    };
                }

                if (channel.subscribe().message().headers()) {
                    // console.log();
                    const schemaIdHeader = channel.subscribe().message().headers()._json['x-parser-schema-id'];

                    try {
                        ajv.compile(
                            this.normaliseSchema(channel.subscribe().message().headers()._json),
                        );
                    } catch (e) {
                        return {
                            msg: 'Schema of ' + (schemaIdMsg || (channelName + ' subscribe message header')) + '\n' + (e.title || e.message),
                            exception: e,
                            context: channel.subscribe().message().headers()._json,
                        };
                    }
                }
            }

            if (channel.publish()) {
                // onsole.log(channel.publish().message().payload()._json);
                const schemaIdMsg = channel.publish().message().payload()._json['x-parser-schema-id'];

                try {
                    ajv.compile(
                        this.normaliseSchema(channel.publish().message().payload()._json),
                    );
                } catch (e) {
                    return {
                        msg: 'Schema of ' + (schemaIdMsg || (channelName + ' publish message payload')) + '\n' + (e.title || e.message),
                        exception: e,
                        context: channel.publish().message().payload()._json,
                    };
                }

                if (channel.publish().message().headers()) {
                    // console.log(channel.publish().message().headers()._json);
                    const schemaIdHeader = channel.publish().message().headers()._json['x-parser-schema-id'];

                    try {
                        ajv.compile(
                            this.normaliseSchema(channel.publish().message().headers()._json),
                        );
                    } catch (e) {
                        return {
                            msg: 'Schema of ' + (schemaIdMsg || (channelName + ' publish message header')) + '\n' + (e.title || e.message),
                            exception: e,
                            context: channel.publish().message().payload()._json,
                        };
                    }
                }
            }
        }
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

    private normaliseSchema(json: any): any {
        this.stripAsyncApiXKeywords(json);

        if (this.supportJsonschema2pojo) {
            this.stripJsonschema2pojoKeywords(json); // https://www.jsonschema2pojo.org/
        }


        json.$schema = 'http://json-schema.org/draft-07/schema';
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
}
