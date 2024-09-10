import EventEmitter from 'node:events';
import { LRUCache } from 'lru-cache';
import type Quote from '../@types/Quote';
import type QuoteArg from '../@types/QuoteArg';
import { type Raw } from '../utils/raw';
import defaultQuote from '../quotes/quote';

export type PutOptions = {
  flags?: 'w' | 'a';
  encoding?: null | BufferEncoding;
  mode?: number;
};

export const defaultPutOptions: PutOptions = { flags: 'w', encoding: null, mode: 0o644 };

export type GetOptions = {
  flags?: 'r';
  encoding?: null | BufferEncoding;
  mode?: number;
  autoClose?: boolean;
};

export const defaultGetOptions: GetOptions = { flags: 'r', encoding: null, mode: 0o644 };

export type ConnectionConfig = {
  quote?: Quote;
};

export default abstract class Connection extends EventEmitter {
  protected config: ConnectionConfig;

  readonly cache = new LRUCache<string, string>({
    max: 1000,
  });

  constructor(config: ConnectionConfig) {
    super();
    this.config = config;

    this.on('connected', () => {
      this.cache.clear();
    });
  }

  quote(value: QuoteArg | QuoteArg[]): string | Raw {
    const quoteFn = this.config.quote || defaultQuote;

    return quoteFn(value);
  }

  // connection
  abstract isConnected(): boolean;

  abstract connect(): Promise<Connection>;
  abstract close(): Promise<Connection>;

  abstract exec(cmd: string): Promise<string>;

  async waitForConnection() {
    if (!this.isConnected()) {
      await this.connect();
    }

    return this;
  }

  // file transfer
  abstract put(localPath: string, remotePath: string, options?: PutOptions): Promise<void>;
  abstract get(remotePath: string, localPath: string, options?: GetOptions): Promise<void>;

  abstract putContent(
    content: string | Buffer,
    remotePath: string,
    options?: PutOptions
  ): Promise<void>;

  abstract getContent(remotePath: string, options?: GetOptions): Promise<Buffer>;
}
