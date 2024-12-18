import yaml from 'js-yaml';
import fs from 'node:fs';
import path from 'node:path';
import { resolveNonJsonRef } from '../../function/Utils';
import { readDirectory } from './fileSystemReader';


export function cliJoin(workingDir: string, dirPath: string, specName: string[]) {
  const absDirPath = path.resolve(workingDir, dirPath);

  if (!fs.existsSync(absDirPath)) {
    throw new Error('No such directory: ' + absDirPath);
  }

  if (!fs.lstatSync(absDirPath).isDirectory()) {
    throw new Error('Is not a directory: ' + absDirPath);

  }

  const [schemaToValidate, additionalFiles] = readDirectory(absDirPath, specName);
  if (!schemaToValidate) {
    throw new Error('Found no file named: ' + specName + ' in dir: ' + absDirPath);
  }

  const resolved = resolveNonJsonRef(schemaToValidate, additionalFiles);

  if (resolved.validationResults.length == 0) {
    return yaml.dump(resolved.resolved, {
      noRefs: true,
    });
  }

  let errorMsg = 'Invalid spec:\n';
  for (const validationResult of resolved.validationResults) {
    errorMsg += '\t' + validationResult.context + '.' + validationResult.item + ': ' + validationResult.error + '\n';
  }
  throw new Error(errorMsg.trimEnd());
}

