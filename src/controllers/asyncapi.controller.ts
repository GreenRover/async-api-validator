import yaml from 'js-yaml';
import JSZip from 'jszip';
import { Body, Consumes, Controller, Post, Produces, Query, Request, Route, SuccessResponse, Tags, UploadedFile, UploadedFiles } from 'tsoa';
import { AsyncApiValidator } from '../function/AsyncApiValidator';
import { RefResolver, ResolvingResult } from '../function/RefResolvers';
import { ValidationResults } from './validationResults';

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
    const validator = createValidator(allowJsonschema2pojo, checkQuality);

    const [_doc, valResult] = await validator.validate(schemaToValidate);

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
    /**
     * Return the full async api document, migth by huge.
     */
    @Query() returnAsyncApiDocument: boolean = false,
  ): Promise<ValidationResults> {

    let schemaToValidate = '';
    const additionalFiles: { [filename: string]: string } = {};

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

    const resolved = resolveNonJsonRef(schemaToValidate, additionalFiles);
    const validator = createValidator(allowJsonschema2pojo, checkQuality, additionalFiles);

    const [doc, valResult] = await validator.validate(resolved.resolved);
    valResult.push(...resolved.validationResults);

    this.setStatus(200);

    return {
      schemaIsValid: valResult.length < 1,
      results: valResult,
      asyncApiDoc: returnAsyncApiDocument ? doc!.json() : undefined,
    };
  }

  /**
   * Join by resolving references and validate your async api schema. Against the standart.
   */
  @Post('/joinAndValidateZip')
  @SuccessResponse('200', 'Schema was joined')
  public async validateSchemaComplexZip(
    /**
     * Zip file containing a JSON or YAML of the AsyncAPI schema to be validated.
     * And additional files like proto files or other separate schema files. That is referenced from spec.json/spec.yaml using $ref.
     */
    @UploadedFile() zipFile: Express.Multer.File,
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
    /**
     * Return the full async api document, migth by huge.
     */
    @Query() returnAsyncApiDocument: boolean = false,
  ): Promise<ValidationResults> {
    const [schemaToValidate, additionalFiles] = await readZipFile(zipFile);

    if (!schemaToValidate) {
      this.setStatus(500);
      return 'Found neigther spec.yaml or spec.json in list of uploaded files.' as any;
    }

    const resolved = resolveNonJsonRef(schemaToValidate, additionalFiles);
    const validator = createValidator(allowJsonschema2pojo, checkQuality, additionalFiles);

    const [doc, valResult] = await validator.validate(resolved.resolved);
    valResult.push(...resolved.validationResults);

    this.setStatus(200);

    return {
      schemaIsValid: valResult.length < 1,
      results: valResult,
      asyncApiDoc: returnAsyncApiDocument ? doc!.json() : undefined,
    };
  }

  /**
   * Join by resolving references your async api schema. Against the standart.
   * The joined document may still be invalid!
   */
  @Post('/joinZip')
  @Produces('text/yaml')
  @SuccessResponse('200', 'Schema was validated')
  public async joinZip(
    /**
     * Zip file containing a JSON or YAML of the AsyncAPI schema to be validated.
     * And additional files like proto files or other separate schema files. That is referenced from spec.json/spec.yaml using $ref.
     */
    @UploadedFile() zipFile: Express.Multer.File,
    @Request() req: Express.Request,
  ): Promise<string> {
    const [schemaToValidate, additionalFiles] = await readZipFile(zipFile);

    if (!schemaToValidate) {
      this.setStatus(500);
      return 'Found neigther spec.yaml or spec.json in list of uploaded files.' as any;
    }

    const resolved = resolveNonJsonRef(schemaToValidate, additionalFiles);

    if (resolved.resolved) {
      this.setStatus(200);

      const payload = yaml.dump(resolved.resolved, {
        noRefs: true,
      });

      const response = (req as any).res as any;
      response
        .set(`Content-Type`, 'text/yaml')
        .send(payload); // for real application
      return payload; // for test
    }


    this.setStatus(500);
    return 'invalid document, please use validate function';
  }

}

async function readZipFile(zipFile: Express.Multer.File): Promise<[string | undefined, { [filename: string]: string }]> {
  const zip = new JSZip();
  await zip.loadAsync(zipFile.buffer);

  let schemaToValidate = undefined;
  const additionalFiles: { [filename: string]: string } = {};

  for (const file of Object.values(zip.files)) {
    if (file.name.toLowerCase() === 'spec.yaml' || file.name.toLowerCase() === 'spec.json') {
      schemaToValidate = await file.async('string');
    } else {
      additionalFiles[file.name] = await file.async('string');
    }
  }

  return [schemaToValidate, additionalFiles];
}

function createValidator(allowJsonschema2pojo: boolean, checkQuality: boolean, additionalFiles: {
  [filename: string]: string
} | undefined = undefined): AsyncApiValidator {
  const validator = new AsyncApiValidator();
  validator.supportJsonschema2pojo = allowJsonschema2pojo;
  validator.checkHavingExamples = checkQuality;
  validator.checkHavingDescription = checkQuality;

  if (additionalFiles) {
    validator.resolveFile(filename => {
      if (additionalFiles[filename]) {
        return additionalFiles[filename];
      }

      filename = removePath(filename);

      return additionalFiles[filename];
    });
  }

  return validator;
}

function resolveNonJsonRef(schemaToValidate: string, additionalFiles: { [filename: string]: string }): ResolvingResult {
  return RefResolver.resolve(schemaToValidate, (filename: string) => {
    if (additionalFiles[filename]) {
      return additionalFiles[filename];
    }

    filename = removePath(filename);

    return additionalFiles[filename];
  });
}

function removePath(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1];
}
