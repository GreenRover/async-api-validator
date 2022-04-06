import { JavaGenerator, JAVA_COMMON_PRESET, JAVA_CONSTRAINTS_PRESET, JAVA_DESCRIPTION_PRESET, JAVA_JACKSON_PRESET } from '@asyncapi/modelina';
import * as AsyncAPIParser from '@asyncapi/parser';
import * as fs from 'fs';

import { Body, Consumes, Controller, Post, Query, Route, SuccessResponse, Tags } from 'tsoa';
import { AsyncApiValidator } from '../function/asyncApiValidator';
import { Utils } from '../function/utils';
import { JsonSchema, ValidationResults } from './validationResults';

export interface StringBody {
    name: string;
}

@Route('/asyncapi')
@Tags('asyncapi')
export class AsyncApiController extends Controller {

    /**
     * Validate your async api schema. Against the standart.
     */
    @Post('/validate')
    @Consumes('text/plain')
    @SuccessResponse('200', 'Schema was validated')
    public async validateSchema(
        /**
         * JSON or YAML of the AsyncAPI schema to be validated.
         * @example
         *   asyncapi: 2.2.0
         *    info:
         *      title: Hello world application
         *      version: '0.1.0'
         *    channels:
         *      hello:
         *        publish:
         *          message:
         *            payload:
         *              type: string
         *              pattern: '^hello .+$'
         */
        @Body() schemaToValidate: string,
        /**
         * Set to true when you use: https://www.jsonschema2pojo.org/
         * To ignore the custom attributes.
         */
        @Query() allowJsonschema2pojo: boolean = false,
        /**
         * Additional extra checks to check if:
         * - Your api contains descripotions for all relewant types.
         * - Your api contains examples to let your user generated sample messages.
         */
        @Query() checkQuality: boolean = false,
    ): Promise<ValidationResults> {
        const validator = new AsyncApiValidator();
        validator.supportJsonschema2pojo = allowJsonschema2pojo;
        validator.checkHavingExamples = checkQuality;
        validator.checkHavingDescription = checkQuality;

        const valResult = await validator.validate(schemaToValidate);

        this.setStatus(200);

        return {
            schemaIsValid: valResult.length < 1,
            results: valResult,
        };
    }

    /**
     * Validate your async api schema. Against the standart.
     */
    @Post('/getJsonschema')
    @Consumes('text/plain')
    @SuccessResponse('200', 'Extracted schema')
    public async getJsonschema(
        @Body() schemaToValidate: string,
    ): Promise<JsonSchema[]> {
        const validator = new AsyncApiValidator();

        try {
            const valResult = await validator.extractJsonschema(schemaToValidate);
            this.setStatus(200);
            return valResult;
        } catch (e) {
            this.setStatus(500);
            return e;
        }
    }

    /**
     * Validate your async api schema. Against the standart.
     */
    @Post('/modelinaGenerate')
    @Consumes('text/plain')
    @SuccessResponse('200', 'Extracted schema')
    public async modelinaGenerate(
        @Body() schemaToValidate: string,
    ): Promise<JsonSchema[]> {
        const parsedJSON = Utils.toJS(schemaToValidate);

        if (parsedJSON.components.schemas) {
            for (const [key, value] of Object.entries(parsedJSON.components.schemas)) {
                this.generateIds(key, value);
            }
        }

        const asyncApiDoc: AsyncAPIParser.AsyncAPIDocument = await AsyncAPIParser.parse(
            parsedJSON,
        );

        for (const [, message] of asyncApiDoc.allMessages()) {
            this.mergeAllOf(message.payload());
        }

        const generator = new JavaGenerator({
            presets: [
                JAVA_DESCRIPTION_PRESET,
                JAVA_JACKSON_PRESET,
                JAVA_CONSTRAINTS_PRESET,
                {
                    preset: JAVA_COMMON_PRESET,
                    options: {
                        equal: true,
                        hashCode: true,
                        classToString: true,
                        marshalling: false,
                    },
                },
            ],
        });
        const models = await generator.generate(asyncApiDoc as any);

        this.cleandir('./demo/');

        try {
            this.setStatus(200);
            return models.map(m => {
                fs.writeFileSync('./demo/' + m.modelName + '.java', m.result);

                return {
                    item: m.modelName,
                    schema: m.result,
                };
            });
        } catch (e) {
            this.setStatus(500);
            return e;
        }
    }

    private cleandir(dir: string): void {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            fs.unlinkSync(dir + file);
        }
    }

    private generateIds(key: string, obj: any): void {
        if (!obj.type ||
            obj.type === 'object' ||
            obj.type === 'array' ||
            (obj.type === 'string' && obj.enum)
        ) {
            if (!obj.$id && !obj.$ref) {
                obj.$id = key;
            }

            if (obj.properties) {
                for (const [k, value] of Object.entries(obj.properties)) {
                    this.generateIds(key + Utils.ucFirst(k), value);
                }
            }

            if (obj.type === 'array' && obj.items) {
                if (obj.$id === key) {
                    obj.$id += 'Array';
                }
                this.generateIds(key, obj.items);
            }

            if (obj.allOf) {
                for (const child of obj.allOf) {
                    this.generateIds(key, child);
                }
            }
        }
    }

    private mergeAllOf(item: AsyncAPIParser.Schema): void {
        if (item.allOf()) {
            const raw = item.json();
            raw.type = 'object';
            if (!raw.properties) {
                raw.properties = {};
            }
            if (!raw.required) {
                raw.required = [];
            }
            if (!raw.patternProperties) {
                raw.patternProperties = {};
            }

            for (const [_, child] of Object.entries(item.allOf())) {
                if (child.json('properties')) {
                    raw.properties = Object.assign({}, raw.properties, child.json('properties'));
                }

                if (child.json('required')) {
                    raw.required = [... new Set([...(raw.required || []), ...child.json('required')])];
                }

                if (child.json('patternProperties')) {
                    raw.patternProperties = Object.assign({}, raw.patternProperties, child.json('patternProperties'));
                }
            }

            delete raw.allOf;
        }

        for (const [_, child] of Object.entries(item.properties())) {
            this.mergeAllOf(child);
        }
    }


}
