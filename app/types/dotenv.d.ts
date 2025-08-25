declare module 'dotenv' {
    export interface DotenvParseOutput {
      [name: string]: string;
    }
  
    export interface DotenvConfigOptions {
      path?: string | string[];
      encoding?: string;
      debug?: boolean;
      override?: boolean;
    }
  
    export interface DotenvConfigOutput {
      error?: Error;
      parsed?: DotenvParseOutput;
    }
  
    export function config(options?: DotenvConfigOptions): DotenvConfigOutput;
    export function parse(src: string | Buffer, options?: DotenvConfigOptions): DotenvParseOutput;
  }