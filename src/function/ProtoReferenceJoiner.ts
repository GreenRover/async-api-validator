import { ProtoMeta } from './ProtoMeta';

const PROTO_IMPORT_PLACEHOLDER: string = '# imports placeholder #';

function parentPath(filename: string): string {
  let parts = filename.split('/');
  parts.pop();
  return parts.join('/');
}

export class ProtoReferenceJoiner {


  /**
   * Replace "imports" in proto buf files
   */
  public static resolveProtoImport(fileContent: string, filename: string, resolveFile: (flename: string) => string): string {
    const meta = new ProtoMeta();
    fileContent = ProtoReferenceJoiner._resolveProtoImport(fileContent, filename, resolveFile, meta);
    fileContent = fileContent.replace(
      PROTO_IMPORT_PLACEHOLDER,
      meta.getGlobalLibInclude().join('\n'),
    );

    return fileContent;
  }

  /**
   * Replace "imports" in proto buf files
   */
  private static _resolveProtoImport(fileContent: string, filename: string, resolveFile: (flename: string) => string, meta: ProtoMeta): string {
    const importPattern = /import "([.\w\-\/]+\.proto)";/;
    const syntaxOrPackagePattern = /(syntax|package)\s+=?\s*"?([\w.-]+)"?;/i;
    const basePath = parentPath(filename);
    const lines = fileContent.split('\n');
    let matcher;

    meta.wasIncluded(filename);

    let output = '';
    for (const line of lines) {

      if (line.trim().startsWith('option ')) {
        /*
          Filter all options. Examples:
            option java_package = "ch.xxx.example";
            option java_multiple_files = true;
         */
        continue;
      } else if (line.trim().startsWith('message ')) {
        /*
          syntax and package are not allowed after a message.
         */
        meta.hasSeenMessage = true;
      }


      if ((matcher = importPattern.exec(line)) !== null) {
        if (meta.getAndSetIsFirstImport()) {
          output += PROTO_IMPORT_PLACEHOLDER + '\n';
        }

        const fileToInclude = (basePath == null) ?
          matcher[1] :
          (basePath + '/' + matcher[1]).replace('\\', '/');

        if (this.isGoogleProto(fileToInclude)) {
          meta.addGlobalLibInclude(line);
        } else if (!meta.hasBeenIncluded(fileToInclude)) { // avoid double includes
          let fileToIncludeContent;
          let additionalError = '';

          try {
            fileToIncludeContent = resolveFile(fileToInclude);
          } catch (e) {
            additionalError = (e instanceof Error) ? e.message : '' + e;
          }

          if (!fileToIncludeContent) {
            throw new Error(`Included proto file '${filename}' has not been found. ${additionalError}`);
          }

          if (fileToIncludeContent) {
            output += this._resolveProtoImport(
                fileToIncludeContent,
                fileToInclude,
                resolveFile,
                meta,
              ).trim() + '\n';
          }
        }

        continue;
      }

      if ((matcher = syntaxOrPackagePattern.exec(line)) !== null) {
        const firstOccurrence = meta.compareOrSet(
          matcher[1].toLowerCase(),
          matcher[2].toLowerCase(),
          filename,
        );
        if (!firstOccurrence) {
          // package and syntax are allowed only once per proto file.
          continue;
        }
      }


      output += line + '\n';
    }

    return output;
  }

  /*
   * Global libs are not contained in zip file. Skip them, visualization and code generators know how to handle them.
   */
  private static isGoogleProto(filename: string): boolean {
    return filename.startsWith('google/type/') || filename.startsWith('google/protobuf/');
  }
}


