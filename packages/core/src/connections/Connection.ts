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

export const defaultGetOptions: GetOptions = { flags: 'r' as const, encoding: null, mode: 0o644 };

export type ConnectionConfig = {};

export default abstract class Connection {
  protected config: ConnectionConfig;

  constructor(config: ConnectionConfig) {
    this.config = config;
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
