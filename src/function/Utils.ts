import JSZip from 'jszip';
import { AsyncApiValidator } from './AsyncApiValidator';
import { RefResolver, ResolvingResult } from './RefResolvers';

export async function readZipFile(zipFile: Express.Multer.File): Promise<[string | undefined, { [filename: string]: string }]> {
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

export function createValidator(allowJsonschema2pojo: boolean, checkQuality: boolean, additionalFiles: {
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

export function resolveNonJsonRef(schemaToValidate: string, additionalFiles: { [filename: string]: string }): ResolvingResult {
  return RefResolver.resolve(schemaToValidate, (filename: string) => {
    filename = filename.replace(/^([\/\\])*/g, '');

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
