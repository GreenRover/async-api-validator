import { Body, Consumes, Controller, Post, Query, Route, SuccessResponse, Tags, UploadedFiles } from 'tsoa';
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
    public async validateSchemaSimple(
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
     * Join by resolving references and validate your async api schema. Against the standart.
     */
    @Post('/joinAndValidate')
    @Consumes('text/plain')
    @SuccessResponse('200', 'Schema was validated')
    public async validateSchemaComplex(

      /**
       * JSON or YAML of the AsyncAPI schema to be validated.
       * And additional files like proto files or other separate schema files. That is referenced from spec.json/spec.yaml using $ref.
       */
      @UploadedFiles() files: Express.Multer.File[],

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

        /**
         * [
         *   {
         *     fieldname: 'additionalFiles',
         *     originalname: 'datF1FF.tmp',
         *     encoding: '7bit',
         *     mimetype: 'application/octet-stream',
         *     buffer: <Buffer 69 53 00 00 9b 52 00 00 02 00 02 00 04 00 00 00 02 0b 08 03 03 02 02 02 02 03 01 00 bc 02 00 00 04 00 4c 50 af 00 00 80 4a 20 00 40 00 00 00 00 00 00 ... 21303 more bytes>,
         *     size: 21353
         *   },
         *   {
         *     fieldname: 'additionalFiles',
         *     originalname: 'l_FyT40uz.html',
         *     encoding: '7bit',
         *     mimetype: 'text/html',
         *     buffer: <Buffer 0a 20 20 20 20 20 20 20 20 20 20 20 20 3c 68 74 6d 6c 3e 0a 20 20 20 20 20 20 20 20 20 20 20 20 20 20 3c 68 65 61 64 3e 0a 20 20 20 20 20 20 20 20 20 ... 11809 more bytes>,
         *     size: 11859
         *   }
         * ]
         */

        let schemaToValidate = '';
        const additionalFiles: {[filename: string]: string} = {}

        for (const file of files) {
            if (file.originalname.toLowerCase() === 'spec.yaml' || file.originalname.toLowerCase() === 'spec.json') {
                schemaToValidate = file.buffer.toString();
            } else {
                additionalFiles[file.originalname] = file.buffer.toString();
            }
        }

        if (!schemaToValidate) {
            this.setStatus(500);
            return 'Found neigther spec.yaml or spec.json in list of uploaded files.' as any;
        }

        const validator = new AsyncApiValidator();
        validator.supportJsonschema2pojo = allowJsonschema2pojo;
        validator.checkHavingExamples = checkQuality;
        validator.checkHavingDescription = checkQuality;

        validator.resolveFile(filename => {
            filename = removePath(filename);
            return additionalFiles[filename];
        });

        const valResult = await validator.validate(schemaToValidate);

        this.setStatus(200);

        return {
            schemaIsValid: valResult.length < 1,
            results: valResult,
        };
    }

}

function removePath(path: string): string {
    const parts = path.split('/');
    return parts[parts.length - 1];
}
