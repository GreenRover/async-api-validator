
export class ProtoMeta {
  private syntax: string | undefined;
  private syntaxLastFilename: string | undefined;
  private packageName: string | undefined;
  private packageNameLastFilename: string | undefined;
  private isFirstImport: boolean = true;
  private includedFiles  = new Set<string>();
  private globalLibInclude = new Set<string>();

  public hasSeenMessage: boolean = false;

  public compareOrSet(field: string, value: string, filename: string): boolean{
    switch (field) {
      case 'syntax': {
        if (!this.syntax || this.syntax.length === 0) {
          if (this.hasSeenMessage) {
            throw new Error(`When using "syntax" or "package" keywords, you have to place them in the very first proto file you reference. First found in ${filename}. But visited before: ${[...this.includedFiles].join(', ')}`);
          }

          this.syntax = value;
          this.syntaxLastFilename = filename;
          return true;
        } else if (this.syntax !== value) {
          throw new Error(`Mixing proto2 and proto3 is not permitted. Example for not matching proto schema files: ${filename} and ${this.syntaxLastFilename}`);
        }
        return false;
      }
      case 'package': {
        if (!this.packageName || this.packageName.length === 0) {
          if (this.hasSeenMessage) {
            throw new Error(`When using "syntax" or "package" keywords, you have to place them in the very first proto file you reference. First found in ${filename}. But visited before: ${[...this.includedFiles].join(', ')}`);
          }

          this.packageName = value;
          this.packageNameLastFilename = filename;
          return true;
        } else if (this.packageName !== value) {
          throw new Error(`Mixing proto "package" is not yet implemented. Found packages: ${value} and ${this.packageName}. Example for not matching proto schema files: ${filename} and ${this.packageNameLastFilename}`);
        }
        return false;
      }
      default:
        throw new Error(`Unknown field: ${field}`);
    };
  }

  public hasBeenIncluded(filename: string): boolean {
    return this.includedFiles.has(filename);
  }

  public wasIncluded(filename: string): void {
    this.includedFiles.add(filename);
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
}
