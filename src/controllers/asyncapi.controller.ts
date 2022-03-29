import { Body, Consumes, Controller, Post, Query, Route, SuccessResponse, Tags } from 'tsoa';
import { AsyncApiValidator } from '../function/asyncApiValidator';
import { ValidationResults } from './validationResults';

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

}
