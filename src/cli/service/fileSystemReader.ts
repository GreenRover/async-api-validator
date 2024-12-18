import fs from 'node:fs';
import path from 'node:path';

export function readDirectory(dirPath: string, specNames: string[]): [string | undefined, { [filename: string]: string }] {
  let schemaToValidate: string | undefined = undefined;
  let additionalFiles: { [filename: string]: string } = {};

  specNames = specNames.map(specName => specName.toLowerCase());
  const files = fs.readdirSync(dirPath);

  for (const fileName of files) {
    const filePath = path.join(dirPath, fileName);
    const lsStat = fs.lstatSync(filePath);

    if (lsStat.isDirectory()) {
      additionalFiles = {
        ...additionalFiles,
        ...recursiveReadDirectory(
          dirPath,
          fileName
        ),
      };
      continue;
    }

    if (!lsStat.isFile()) {
      continue;
    }
    const fileContent = fs.readFileSync(filePath).toString();
    if (specNames.indexOf(fileName.toLowerCase()) !== -1) {
      schemaToValidate = fileContent;
    } else {
      additionalFiles[fileName] = fileContent;
    }
  }

  return [schemaToValidate, additionalFiles];
}

function recursiveReadDirectory(rootDir: string, subDir: string, depth: number = 1) {
  let fileContents: { [filename: string]: string } = {};

  const files = fs.readdirSync(path.join(rootDir, subDir));
  for (const fileName of files) {
    const filePath = path.join(rootDir, subDir, fileName);
    const lsStat = fs.lstatSync(filePath);

    if (lsStat.isDirectory()) {
      if (depth > 10) {
        continue; // Avoid endless link loop following
      }

      fileContents = {
        ...fileContents,
        ...recursiveReadDirectory(
          rootDir,
          path.join(subDir, fileName),
          depth+1
        ),
      };
    } else if (lsStat.isFile()) {
      const filePathUnixStyle = path.join(subDir, fileName).replace(new RegExp('\\\\', 'g'), '/');
      fileContents[filePathUnixStyle] = fs.readFileSync(filePath).toString();
    }
  }

  return fileContents;
}