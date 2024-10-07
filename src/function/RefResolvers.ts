import yaml from 'js-yaml';
import { ValidationResult } from '../controllers/validationResults';
import { ProtoReferenceJoiner } from './ProtoReferenceJoiner';

/**
 * Resolves ref to any kind of file that is not json compatible.
 */
export class RefResolver {

  public static resolve(source: any, resolveFile: (path: string) => string): ResolvingResult {
    try {
      source = yaml.load(source);
    } catch (_) {
      source = JSON.parse(source);
    }

    const validationResults: ValidationResult[] = [];

    const resolved = this.findAndTranslateRef(source, ref => {
      const parts = ref.split('#');
      if (parts[0]) {
        if (parts[1]) {
          validationResults.push({
            item: ref,
            error: '$ref to files with anchor are not supported',
            context: 'in proto file',
          });
        }

        if (parts[0].endsWith('.proto')) {
          try {
            return ProtoReferenceJoiner.resolveProtoImport(
              resolveFile(parts[0]),
              parts[0],
              resolveFile,
            );
          } catch (e) {
            validationResults.push({
              item: '',
              error: ((e instanceof Error) ? e.message : '' + e),
              context: 'in proto file',
            });
            return {};
          }
        }

        return resolveFile(parts[0]);
      }

      return null;
    });

    return {
      resolved,
      validationResults,
    };
  }

  private static findAndTranslateRef(json: any, resolve: (ref: string) => any): any {
    if (json === undefined || json === null) {
      return;
    }

    if (json['$ref']) {
      const res = resolve(json['$ref']);
      if (res) {
        delete json['$ref'];
        if (typeof res === 'object') {
          return { ...json, ...res };
        }
        return res;
      }
    }

    for (const [key, value] of Object.entries(json)) {
      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          if (typeof key[i] === 'object') {
            json[key][i] = this.findAndTranslateRef(key[i], resolve);
          }
        }
      } else if (typeof value === 'object') {
        json[key] = this.findAndTranslateRef(value, resolve);
      }
    }

    return json;
  }
}

export interface ResolvingResult {
  resolved: any;
  validationResults: ValidationResult[];
}
