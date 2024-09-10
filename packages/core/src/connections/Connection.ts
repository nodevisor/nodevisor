import EventEmitter from 'node:events';
import { LRUCache } from 'lru-cache';
import quote from '../quotes/quote';
import powerShellQuote from '../quotes/powerShellQuote';
import Platform from '../constants/Platform';
import CommandBuilder, { type CommandBuilderOptions } from '../CommandBuilder';

const platforms = Object.values(Platform) as string[];

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

  async getQuote() {
    const platform = await this.platform();

    switch (platform) {
      case Platform.WINDOWS:
        return powerShellQuote;
      default:
        return quote;
    }
  }

  cmd(options?: CommandBuilderOptions): CommandBuilder {
    return new CommandBuilder(this, options);
  }

  $(strings: TemplateStringsArray, ...values: any[]): CommandBuilder {
    return this.cmd().$(strings, ...values);
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

  async platform() {
    return this.cached('platform', async () => {
      try {
        const platform = await this.$`uname -s`.shellQuote().toLowerCase();
        if (platforms.includes(platform)) {
          return platform as Platform;
        }

        if (platform.includes('mingw') || platform.includes('cygwin')) {
          return Platform.WINDOWS;
        }

        throw new Error('Unsupported platform');
      } catch (error) {
        const platform = await this
          .$`powershell -command "(Get-WmiObject Win32_OperatingSystem).Caption"`
          .powerShellQuote()
          .toLowerCase();

        if (platforms.includes(platform)) {
          return platform as Platform;
        }

        if (platform.includes('windows')) {
          return Platform.WINDOWS;
        }
      }

      throw new Error('Unsupported platform');
    });
  }

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
