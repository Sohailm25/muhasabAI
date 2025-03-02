/**
 * Type declarations for modules without TypeScript definitions
 */

declare module 'bcrypt' {
  export function hash(data: string, saltOrRounds: string | number): Promise<string>;
  export function compare(data: string, encrypted: string): Promise<boolean>;
}

declare module 'jsonwebtoken' {
  export interface JwtPayload {
    [key: string]: any;
  }
  export function sign(
    payload: string | Buffer | object,
    secretOrPrivateKey: string | Buffer,
    options?: { expiresIn?: string | number; [key: string]: any }
  ): string;
  export function verify(
    token: string,
    secretOrPublicKey: string | Buffer
  ): JwtPayload & { [key: string]: any };
  export class JsonWebTokenError extends Error {
    constructor(message: string);
  }
}

declare module 'better-sqlite3' {
  interface Database {
    prepare(sql: string): Statement;
    transaction(fn: Function): Function;
    pragma(pragma: string, options?: { simple: boolean }): any;
    checkpoint(databaseName?: string): void;
    function(name: string, cb: Function): void;
    aggregate(name: string, options: object): void;
    loadExtension(path: string): void;
    exec(sql: string): void;
    close(): void;
  }

  interface Statement {
    run(...params: any[]): object;
    get(...params: any[]): any;
    all(...params: any[]): any[];
    iterate(...params: any[]): Iterable<any>;
    bind(...params: any[]): Statement;
    columns(): object[];
    raw(raw?: boolean): Statement;
    expanded(expanded?: boolean): Statement;
    pluck(pluck?: boolean): Statement;
  }

  export default function(
    filename: string,
    options?: { 
      readonly?: boolean; 
      fileMustExist?: boolean; 
      timeout?: number; 
      verbose?: Function;
    }
  ): Database;
}

// Add declaration for jsonwebtoken module
declare module 'jsonwebtoken'; 