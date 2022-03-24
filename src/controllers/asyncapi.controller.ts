import { Controller, Post, Query, Response, Route, SuccessResponse, Tags, Body, Consumes } from 'tsoa';
import { AsyncApiValidator } from '../function/asyncApiValidator';
import { ValidationResults } from './validationResults';

export interface StringBody {
    name: string
}

@Route('/asyncapi')
@Tags('asyncapi')
export class AsyncApiController extends Controller {

    /**
     * Validate your async api schema. Against the standart.
     */
    @Post('/validate')
    @Consumes('text/plain')
    @SuccessResponse('201', 'Schema is validate')
    @Response<ValidationResults>(422, 'Validation Failed')
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

        const valResult = await validator.validate(schemaToValidate);

        this.setStatus(valResult == null ? 201 : 422);

        return {
            schemaIsValid: valResult == null,
            results: [
                valResult,
            ],
        };
    }

}
