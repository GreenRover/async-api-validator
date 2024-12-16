
export class ProtoMeta {
  private syntax: string | undefined;
  private syntaxLastFilename: string | undefined;
  private rootPackageName: string | undefined;
  private nonRootPackages: string[] = [];
  private isFirstImport: boolean = true;
  private includedFiles  = new Set<string>();
  private globalLibInclude = new Set<string>();

  public hasSeenMessage: boolean = false;

  public compareOrSetField(field: string, value: string, fileMeta: ProtoMetaFile): boolean{
    switch (field) {
      case 'syntax': {
        if (!this.syntax || this.syntax.length === 0) {
          if (this.hasSeenMessage) {
            throw new Error(`When using "syntax" or "package" keywords, you have to place them in the very first proto file you reference. First found in ${fileMeta.fileName}. But visited before: ${[...this.includedFiles].join(', ')}`);
          }

          this.syntax = value;
          this.syntaxLastFilename = fileMeta.fileName;
          return true;
        } else if (this.syntax !== value) {
          throw new Error(`Mixing proto2 and proto3 is not permitted. Example for not matching proto schema files: ${fileMeta.fileName} and ${this.syntaxLastFilename}`);
        }
        return false;
      }
      case 'package': {
        fileMeta.packageName = value;

        if (!this.rootPackageName || this.rootPackageName.length === 0) {
          if (this.hasSeenMessage) {
            throw new Error(`When using "syntax" or "package" keywords, you have to place them in the very first proto file you reference. First found in ${fileMeta.fileName}. But visited before: ${[...this.includedFiles].join(', ')}`);
          }

          this.rootPackageName = value;
          return true;
        } else if (this.rootPackageName !== value) {
          fileMeta.nonRootPackage = true;
          this.nonRootPackages.push(value);
        }
        return false;
      }
      default:
        throw new Error(`Unknown field: ${field}`);
    }
  }

  public hasBeenIncluded(filename: string): boolean {
    return this.includedFiles.has(filename);
  }

  public addFile(filename: ProtoMetaFile): void {
    this.includedFiles.add(filename.fileName);
  }

  public addGlobalLibInclude(filename: string): void  {
    this.globalLibInclude.add(filename);
  }

  public getGlobalLibInclude(): string [] {
    return [...this.globalLibInclude];
  }

  public getAndSetIsFirstImport(): boolean {
    try {
      return this.isFirstImport;
    } finally {
      this.isFirstImport = false;
    }
  }

  public isRootPackage(packageName: string) {
    return this.rootPackageName === packageName;
  }

  public packageNamePrefix(packageName: string): string {
    return packageName.replace('.', '_') + '_';
  }
}

export class ProtoMetaFile {
  fileName: string;
  packageName: string | undefined;
  nonRootPackage: boolean = false;

  constructor(fileName: string) {
    this.fileName = fileName;
  }
}