import fs from 'node:fs/promises';
import shell from 'shelljs';
import baseLog from '../utils/log';
import Connection, {
  type ConnectionConfig,
  type PutOptions,
  type GetOptions,
  defaultPutOptions,
  defaultGetOptions,
} from './Connection';

const log = baseLog.extend('shell-connection');
const logExec = log.extend('exec');
const logResponse = log.extend('response');
const logError = log.extend('error');

async function exec(cmd: string) {
  return new Promise<string>((resolve, reject) => {
    shell.exec(cmd, { silent: true }, (code: number, stdout: string, stderr: string) => {
      if (code !== 0) {
        reject(new Error(stderr));
        return;
      }

      resolve(stdout);
    });
  });
}

export type ShellConnectionConfig = ConnectionConfig & {};

export default class ShellConnection extends Connection {
  private connected = false;

  constructor(config: ConnectionConfig = {}) {
    super(config);
  }

  isConnected() {
    return this.connected;
  }

  async connect() {
    this.connected = true;
    return this;
  }

  async exec(cmd: string) {
    try {
      await this.waitForConnection();

      logExec(cmd);
      const stdout = await exec(cmd);

      return stdout;
    } catch (error) {
      logError(`Error executing command '${cmd}':`, error);
      throw error;
    }
  }

  async close() {
    this.connected = false;
    return this;
  }

  // file transfer
  async put(localPath: string, remotePath: string, options?: PutOptions) {
    const { flags, mode, encoding } = {
      ...defaultPutOptions,
      ...options,
    };

    try {
      logExec(`Copying file from ${localPath} to ${remotePath}`);
      const content = await fs.readFile(localPath);
      await fs.writeFile(remotePath, content, {
        flag: flags,
        encoding,
        mode,
      });
      logResponse(`File copied successfully to ${remotePath}`);
    } catch (error) {
      logError(`Error copying file from ${localPath} to ${remotePath}:`, error);
      throw error;
    }
  }

  async putContent(content: string | Buffer, remotePath: string, options?: PutOptions) {
    const { flags, mode, encoding } = {
      ...defaultPutOptions,
      ...options,
    };

    try {
      logExec(`Writing content to ${remotePath}`);
      await fs.writeFile(remotePath, content, {
        flag: flags,
        encoding,
        mode,
      });
      logResponse(`Content written successfully to ${remotePath}`);
    } catch (error) {
      logError(`Error writing content to ${remotePath}:`, error);
      throw error;
    }
  }

  async get(remotePath: string, localPath: string, options?: GetOptions) {
    const { flags, mode, encoding } = {
      ...defaultGetOptions,
      ...options,
    };

    try {
      logExec(`Copying file from ${remotePath} to ${localPath}`);
      const content = await fs.readFile(remotePath, {
        encoding,
        flag: flags,
      });

      await fs.writeFile(localPath, content, {
        flag: 'w',
        mode,
      });

      logResponse(`File copied successfully to ${localPath}`);
    } catch (error) {
      logError(`Error copying file from ${remotePath} to ${localPath}:`, error);
      throw error;
    }
  }

  async getContent(remotePath: string, options?: GetOptions): Promise<Buffer> {
    const { flags, encoding } = {
      ...defaultGetOptions,
      ...options,
    };

    try {
      logExec(`Reading content from ${remotePath}`);
      const content = await fs.readFile(remotePath, {
        encoding,
        flag: flags,
      });

      logResponse(`Content read successfully from ${remotePath}`);
      return Buffer.isBuffer(content) ? content : Buffer.from(content);
    } catch (error) {
      logError(`Error reading content from ${remotePath}:`, error);
      throw error;
    }
  }
}
