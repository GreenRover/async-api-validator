import { AvroSchemaParser } from '@asyncapi/avro-schema-parser';
import { OpenAPISchemaParser } from '@asyncapi/openapi-schema-parser';
import { AsyncAPIDocumentInterface, Parser as AsyncapiParser, SchemaInterface } from '@asyncapi/parser';
import { ParserOptions } from '@asyncapi/parser/esm/parser';
import { ProtoBuffSchemaParser } from '@asyncapi/protobuf-schema-parser';
import { DiagnosticSeverity } from '@stoplight/types';
import type Uri from 'urijs';

import { ValidationResult } from '../controllers/validationResults';
import { SchemaValidator } from './SchemaValidator';

export class AsyncApiValidator {

  private fileResolver: ((filename: string) => string) | undefined = undefined;

  public supportJsonschema2pojo = false;
  public checkHavingExamples = false;
  public checkHavingDescription = false;


  public async validate(schema: string): Promise<[AsyncAPIDocumentInterface | undefined, ValidationResult[]]> {
    const parserOptions: ParserOptions = {
      ruleset: {
        core: true,
        recommended: true,
      },
    };

    const results: ValidationResult[] = [];

    if (this.fileResolver !== undefined) {
      parserOptions.__unstable = {
        resolver: {
          cache: false,
          resolvers: [
            {
              schema: 'file',
              order: -1,
              canRead: true,
              read: (uri: Uri, _ctx?: any) => this.loadFile(uri) as string,
            },
          ],
        },
      };
    }

    const asyncapiParser = new AsyncapiParser(parserOptions);
    asyncapiParser.registerSchemaParser(OpenAPISchemaParser() as any);
    asyncapiParser.registerSchemaParser(AvroSchemaParser() as any);
    asyncapiParser.registerSchemaParser(ProtoBuffSchemaParser() as any);

    let asyncApiDoc: AsyncAPIDocumentInterface | undefined;
    try {
      const out = await asyncapiParser.parse(
        schema,
      );
      asyncApiDoc = out.document;

      for (const diagnostic of out.diagnostics) {
        if (diagnostic.severity == DiagnosticSeverity.Error) {
          results.push({
            item: '' + diagnostic.code,
            error: diagnostic.message,
            context: diagnostic.path.join('.'),
          });
        }
      }
    } catch (err) {
      return [asyncApiDoc, [{
        item: 'asyncApi',
        error: this._formatError(err),
      }]];
    }

    if (asyncApiDoc == undefined) {
      return [asyncApiDoc, results];
    }

    const schemaValidator = new SchemaValidator();
    schemaValidator.asyncApiVersion = asyncApiDoc.version();

    for (const channel of asyncApiDoc.channels()) {
      for (const message of channel.messages()) {
        const payload = message.payload();

        if (payload) {
          let schemaIdMsg = this.getSchemaId(payload);
          if (!schemaIdMsg || schemaIdMsg.indexOf('anonymous') !== -1) {
            schemaIdMsg = message.id() + ' message payload';
          }
          if (!schemaIdMsg || schemaIdMsg.indexOf('anonymous') !== -1) {
            schemaIdMsg = 'channel ' + channel.id() + ' message payload';
          }

          results.push(...schemaValidator.checkSchema(
            payload,
            message.schemaFormat(),
            'Schema of ' + schemaIdMsg,
          ));
        }

        if (message.headers()) {
          results.push(...schemaValidator.checkSchema(
            message.headers() as SchemaInterface,
            message.schemaFormat(),
            'Schema of ' + (message.id() + ' message header'),
          ));
        }
      }
    }

    return [asyncApiDoc, results];
  }

  private _formatError(err: any) {
    const title = err.title || err.message;
    let details = 'Error Details: ';
    details += err.detail ? err.detail : '';
    if (err.validationErrors && err.validationErrors.length) {
      err.validationErrors.forEach((element: { title: any; }) => {
        details += '\n\t' + (element.title ? element.title : '');
      });
    }
    return `${title}\n${details}`;
  }

  private getSchemaId(payload: SchemaInterface): string | undefined {
    const schemaId: string = (payload as any).json('x-parser-schema-id');

    if (schemaId && schemaId.indexOf('anonymous-schema')) {
      return undefined;
    }

    return schemaId;
  }

  private loadFile(uri: Uri): any {
    return this.fileResolver && this.fileResolver(uri.filename());
  }

  resolveFile(fileResolver: (filename: string) => string) {
    this.fileResolver = fileResolver;
  }
}
