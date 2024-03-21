import { SchemaInterface } from '@asyncapi/parser';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { ValidationResult } from '../controllers/validationResults';
import * as asyncApim200ExternalDocs from '../schemas/asyncapi_2.0.0_externalDocs.json';
import * as asyncApim200Schema from '../schemas/asyncapi_2.0.0_schema.json';

import * as asyncApim200SpecificationExtension from '../schemas/asyncapi_2.0.0_specificationExtension.json';
import * as asyncApim240ExternalDocs from '../schemas/asyncapi_2.4.0_externalDocs.json';
import * as asyncApim240Schema from '../schemas/asyncapi_2.4.0_schema.json';

import * as asyncApim240SpecificationExtension from '../schemas/asyncapi_2.4.0_specificationExtension.json';
import * as asyncApim260ExternalDocs from '../schemas/asyncapi_2.6.0_externalDocs.json';
import * as asyncApim260Schema from '../schemas/asyncapi_2.6.0_schema.json';

import * as asyncApim260SpecificationExtension from '../schemas/asyncapi_2.6.0_specificationExtension.json';
import * as asyncApim300ExternalDocs from '../schemas/asyncapi_3.0.0_externalDocs.json';
import * as asyncApim300MultifomatSchema from '../schemas/asyncapi_3.0.0_multiFormatSchema.json';
import * as asyncApim300Reference from '../schemas/asyncapi_3.0.0_reference.json';
import * as asyncApim300ReferenceObject from '../schemas/asyncapi_3.0.0_referenceObject.json';

import * as asyncApim300Schema from '../schemas/asyncapi_3.0.0_schema.json';
import * as asyncApim300SpecificationExtension from '../schemas/asyncapi_3.0.0_specificationExtension.json';
import * as asyncApim300Avro from '../schemas/avroSchema_v1.json';
import * as asyncApim300OpenApi from '../schemas/openapiSchema_3_0.json';

export class SchemaValidator {

  public supportJsonschema2pojo = false;
  public checkHavingExamples = false;
  public checkHavingDescription = false;
  public asyncApiVersion: string = '2.6.0';

  public ajv() {
    const ajv = new Ajv({
      allErrors: true,
      strictNumbers: true,
      strictSchema: true,
      validateSchema: true,
      removeAdditional: false,
      allowUnionTypes: true,
      logger: false
    });

    addFormats(ajv);

    ajv.addSchema(asyncApim200SpecificationExtension, 'http://asyncapi.com/definitions/2.0.0/specificationExtension.json');
    ajv.addSchema(asyncApim200ExternalDocs, 'http://asyncapi.com/definitions/2.0.0/externalDocs.json');
    ajv.addSchema(asyncApim200Schema, 'http://asyncapi.com/definitions/2.0.0/schema.json');

    ajv.addSchema(asyncApim240SpecificationExtension, 'http://asyncapi.com/definitions/2.4.0/specificationExtension.json');
    ajv.addSchema(asyncApim240ExternalDocs, 'http://asyncapi.com/definitions/2.4.0/externalDocs.json');
    ajv.addSchema(asyncApim240Schema, 'http://asyncapi.com/definitions/2.4.0/schema.json');

    ajv.addSchema(asyncApim260SpecificationExtension, 'http://asyncapi.com/definitions/2.6.0/specificationExtension.json');
    ajv.addSchema(asyncApim260ExternalDocs, 'http://asyncapi.com/definitions/2.6.0/externalDocs.json');
    ajv.addSchema(asyncApim260Schema, 'http://asyncapi.com/definitions/2.6.0/schema.json');

    ajv.addSchema(asyncApim300SpecificationExtension, 'http://asyncapi.com/definitions/3.0.0/specificationExtension.json');
    ajv.addSchema(asyncApim300ReferenceObject, 'http://asyncapi.com/definitions/3.0.0/ReferenceObject.json');
    ajv.addSchema(asyncApim300Reference, 'http://asyncapi.com/definitions/3.0.0/Reference.json');
    ajv.addSchema(asyncApim300ExternalDocs, 'http://asyncapi.com/definitions/3.0.0/externalDocs.json');
    ajv.addSchema(asyncApim300Schema, 'http://asyncapi.com/definitions/3.0.0/schema.json');
    ajv.addSchema(asyncApim300MultifomatSchema, 'http://asyncapi.com/definitions/3.0.0/multiFormatSchema.json');

    ajv.addSchema(asyncApim300OpenApi, 'http://asyncapi.com/definitions/3.0.0/openapiSchema_3_0.json');
    ajv.addSchema(asyncApim300Avro, 'http://asyncapi.com/definitions/3.0.0/avroSchema_v1.json');

    // Add keywords for async api mixed ins.
    ajv.addKeyword({
      keyword: 'discriminator',
      type: 'string',
    });
    ajv.addKeyword({
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

    return ajv;
  }

  public checkSchema(json: SchemaInterface, schemaFormat: string | undefined, title: string) {
    const results: ValidationResult[] = [];

    const normalizeSchema = this.normalizeSchema(json.json(), schemaFormat);
    try {
      this.ajv().validateSchema(normalizeSchema);

      if (this.checkHavingExamples) {
        results.push(...this.checkExamples(json, title + ' '));
      }
      if (this.checkHavingDescription) {
        results.push(...this.checkDescription(json, title + ' '));
      }
    } catch (e: any) {
      results.push({
        item: title,
        error: (e.title || e.message),
        context: JSON.stringify(normalizeSchema, null, 2),
      });
    }

    return results;
  }


  private checkExamples(schema: SchemaInterface, title: string) {
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
            for (const subSchema of schema.items() as SchemaInterface[]) {
              results.push(...this.checkExamples(subSchema, title + '.items'));
            }
          } else {
            results.push(...this.checkExamples(schema.items() as SchemaInterface, title + '.items'));
          }
          break;
        case 'object':
          if (schema.oneOf()) {
            (schema.oneOf() as SchemaInterface[]).forEach(child => {
              results.push(...this.checkExamples(child, title + '.oneOf.' + schema.$id));
            });
          }
          if (schema.allOf()) {
            (schema.allOf() as SchemaInterface[]).forEach(child => {
              results.push(...this.checkExamples(child, title + '.allOf.' + schema.$id));
            });
          }
          if (schema.anyOf()) {
            (schema.anyOf() as SchemaInterface[]).forEach(child => {
              results.push(...this.checkExamples(child, title + '.anyOf.' + schema.$id));
            });
          }

          for (const [key, value] of Object.entries(schema.properties() as { [key: string]: SchemaInterface })) {
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

  private checkExampleExists(schema: SchemaInterface, item: string): ValidationResult[] {
    if (schema.examples()) {
      return [];
    }

    return [
      {
        item: item + '.examples',
        error: 'missing examples',
        context: JSON.stringify(schema.json(), null, 2),
      },
    ];
  }

  private checkDescription(schema: SchemaInterface, title: string) {
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
            (schema.items() as SchemaInterface[]).forEach((subSchema, i) => {
              results.push(...this.checkDescription(subSchema, title + '.items[' + i + ']'));
            });
          } else {
            const item = schema.items() as SchemaInterface;
            if (item.type() && item.type() !== 'object') {
              results.push(...this.checkDescriptionExists(schema, title));
            }
            results.push(...this.checkDescription(item, title + '.items'));
          }
          break;
        case 'object':
          if (schema.oneOf()) {
            (schema.oneOf() as SchemaInterface[]).forEach((child, i) => {
              results.push(...this.checkDescription(child, title + '.oneOf[' + i + ']'));
            });
          }
          if (schema.allOf()) {
            (schema.allOf() as SchemaInterface[]).forEach((child, i) => {
              results.push(...this.checkDescription(child, title + '.allOf[' + i + ']'));
            });
          }
          if (schema.anyOf()) {
            (schema.anyOf() as SchemaInterface[]).forEach((child, i) => {
              results.push(...this.checkDescription(child, title + '.anyOf[' + i + ']'));
            });
          }

          if (schema.properties()) {
            results.push(...this.checkDescriptionExists(schema, title));
          }
          for (const [key, value] of Object.entries(schema.properties() as { [key: string]: SchemaInterface })) {
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

  private checkDescriptionExists(schema: SchemaInterface, item: string): ValidationResult[] {
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


  private normalizeSchema(json: any, schemaFormat: string | undefined): any {
    SchemaValidator.stripAsyncApiXKeywords(json);

    if (this.supportJsonschema2pojo) {
      SchemaValidator.stripJsonschema2pojoKeywords(json); // https://www.jsonschema2pojo.org/
    }

    if (schemaFormat && schemaFormat.startsWith('application/vnd.aai.asyncapi')) {
      return this.getSchemaByAsyncApiVersion(schemaFormat.split('=')[1]);
    } else if (schemaFormat === 'application/schema+json;version=draft-07' || schemaFormat === 'application/schema+yaml;version=draft-07') {
      json.$schema = 'http://json-schema.org/draft-07/schema';
    } else {
      json.$schema = this.getSchemaByAsyncApiVersion(this.asyncApiVersion);
    }

    return json;
  }

  private getSchemaByAsyncApiVersion(asyncApiVersion: string): string {
    const numericVersion = toNumericVersion(asyncApiVersion);
    if (numericVersion >= 30000) {
      return 'http://asyncapi.com/definitions/3.0.0/multiFormatSchema.json';
    } else if (numericVersion >= 20600) {
      return 'http://asyncapi.com/definitions/2.6.0/schema.json';
    } else if (numericVersion >= 20400) {
      return 'http://asyncapi.com/definitions/2.4.0/schema.json';
    } else {
      return 'http://asyncapi.com/definitions/2.0.0/schema.json';
    }
  }

  public static stripAsyncApiXKeywords(json: any, callPath: any[] = []): any {
    if (json === undefined || json === null) {
      return;
    }
    if (callPath.indexOf(json) !== -1) {
      // prevent endless recursion.
      return;
    }
    for (const [key, value] of Object.entries(json)) {
      if (key.startsWith('x-')) {
        delete json[key];
      } else if (Array.isArray(value)) {
        for (const val of value) {
          if (typeof val === 'object') {
            this.stripAsyncApiXKeywords(val, [...callPath, val]);
          }
        }
      } else if (typeof value === 'object') {
        this.stripAsyncApiXKeywords(value, [...callPath, value]);
      }
    }

    return json;
  }

  public static stripJsonschema2pojoKeywords(json: any, callPath: any[] = []): any {
    if (json === undefined || json === null) {
      return;
    }
    if (callPath.indexOf(json) !== -1) {
      // prevent endless recursion.
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
            this.stripJsonschema2pojoKeywords(val, [...callPath, val]);
          }
        }
      } else if (typeof value === 'object') {
        this.stripJsonschema2pojoKeywords(value, [...callPath, value]);
      }
    }
  }
}

function toNumericVersion(semanticVersion: string): number {
  const parts = semanticVersion.split('.');
  let numericVersion = 0;
  if (parts.length >= 1) {
    numericVersion += parseInt(parts[0]) * 10000;
  }
  if (parts.length >= 2) {
    numericVersion += parseInt(parts[1]) * 100;
  }
  if (parts.length >= 3) {
    numericVersion += parseInt(parts[2]);
  }

  return numericVersion;
}
