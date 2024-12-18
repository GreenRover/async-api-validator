import { ProtoMeta, ProtoMetaFile } from './ProtoMeta';

const PROTO_IMPORT_PLACEHOLDER: string = '# imports placeholder #';

function parentPath(filename: string): string {
  const parts = filename.split('/');
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
    const importPattern = /import "([.\w\-/]+\.proto)";/;
    const fieldPattern = /(\s+(optional|required)?(\s+repeated)?\s+)(?<package>[\w\-.]+)\.((?<type>[\w-]+)\s+(?<fieldName>[\w-]+)\s*=\s*\d+)/;
    const syntaxOrPackagePattern = /(syntax|package)\s+=?\s*"?([\w.-]+)"?;/i;
    const basePath = parentPath(filename);
    const lines = fileContent.split('\n');
    let matcher;

    const fileMeta = new ProtoMetaFile(filename);

    meta.addFile(fileMeta);

    let output = '';
    for (let line of lines) {

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

        if (fileMeta.nonRootPackage) {
          // prefix message name if is not part of root package
          line = line.replace(
            /(\s*message\s+)([\w\-.]+\s+){/,
            '$1' + meta.packageNamePrefix(fileMeta.packageName!) + '_$2{'
          );
        }
      }


      if ((matcher = importPattern.exec(line)) !== null) {
        if (meta.getAndSetIsFirstImport()) {
          output += PROTO_IMPORT_PLACEHOLDER + '\n';
        }

        const fileToInclude = (basePath == null) ?
          matcher[1] :
          (basePath + '/' + matcher[1]).replace('\\', '/');

        if (this.isGoogleProto(matcher[1])) {
          meta.addGlobalLibInclude(line);
        } else if (this.isProtocValid(matcher[1])) {
          // Nothing to include
        } else if (!meta.hasBeenIncluded(fileToInclude)) { // avoid double includes
          let fileToIncludeContent;
          let additionalError = '';

          try {
            fileToIncludeContent = resolveFile(fileToInclude);
          } catch (e) {
            additionalError = (e instanceof Error) ? e.message : '' + e;
          }

          if (!fileToIncludeContent) {
            throw new Error(`Included proto file '${fileToInclude}' has not been found. Was referenced in ${filename}. ${additionalError}`);
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
        const firstOccurrence = meta.compareOrSetField(
          matcher[1].toLowerCase(),
          matcher[2].toLowerCase(),
          fileMeta,
        );
        if (!firstOccurrence) {
          // package and syntax are allowed only once per proto file.
          continue;
        }
      } else if ((matcher = fieldPattern.exec(line)) !== null) {
        if (!meta.isRootPackage(matcher.groups!.package)) {
          line = line.replace(fieldPattern, '$1' + meta.packageNamePrefix(matcher.groups!.package) + '_$5');
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
    return filename.startsWith('google/type/') || filename.startsWith('google/protobuf/') ||
      filename.startsWith('/google/type/') || filename.startsWith('/google/protobuf/');
  }

  /*
 * Global libs are not contained in zip file. Skip them, visualization and code generators know how to handle them.
 */
  private static isProtocValid(filename: string): boolean {
    return filename === 'validate/validate.proto' ||
           filename === '/validate/validate.proto';
  }
}


