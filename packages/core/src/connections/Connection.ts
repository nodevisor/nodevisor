import EventEmitter from 'node:events';
import { LRUCache } from 'lru-cache';
import CommandBuilder, { type CommandBuilderOptions } from '../commands/CommandBuilder';
import CommandOutput from '../commands/CommandOutput';

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

export type ConnectionConfig = {};

export default abstract class Connection extends EventEmitter {
  protected config: ConnectionConfig;

  readonly cache = new LRUCache<string, string>({
    max: 1000,
  });

  constructor(config: ConnectionConfig = {}) {
    super();
    this.config = config;
  }

  cmd(options: CommandBuilderOptions): CommandBuilder {
    return new CommandBuilder(this, {
      ...options,
    });
  }

  async cached<T extends string>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.cache.has(key)) {
      return this.cache.get(key) as T;
    }

    const value = await fn();
    this.cache.set(key, value);

    return value;
  }

  // connection
  abstract isConnected(): boolean;

  abstract connect(): Promise<Connection>;
  abstract close(): Promise<Connection>;

  async onConnected() {
    this.cache.clear();
  }

  async onDisconnected() {
    this.cache.clear();
  }

  abstract exec(cmd: string): Promise<CommandOutput>;

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
    options?: PutOptions,
  ): Promise<void>;

  abstract getContent(remotePath: string, options?: GetOptions): Promise<Buffer>;
}
