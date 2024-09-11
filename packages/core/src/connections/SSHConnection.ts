import fs from 'node:fs/promises';
import os from 'node:os';

import { NodeSSH, type Config as NodeSSHConfig } from 'node-ssh';
import SFTPClient from 'ssh2-sftp-client';
import baseLog from '../utils/log';
import Connection, {
  defaultPutOptions,
  defaultGetOptions,
  type ConnectionConfig,
  type PutOptions,
  type GetOptions,
} from './Connection';
import InMemoryWriteStream from '../utils/InMemoryWriteStream';

const log = baseLog.extend('ssh-connection');
const logExec = log.extend('exec');
const logResponse = log.extend('response');
const logError = log.extend('error');

export type SSHConnectionConfig = ConnectionConfig & {
  host?: string;
  username: string;

  port?: number;

  forceIPv4?: boolean;
  forceIPv6?: boolean;
  agent?: string;
  readyTimeout?: number;
} & (
    | {
        password?: string;
      }
    | {
        privateKey: string;
        passphrase?: string;
      }
    | {
        privateKeyPath: string;
        passphrase?: string;
      }
  );

export default class SSHConnection extends Connection {
  private ssh: NodeSSH;

  constructor(config: SSHConnectionConfig) {
    super(config);

    this.ssh = new NodeSSH();
  }

  private async prepareSSH2Config(config: SSHConnectionConfig): Promise<NodeSSHConfig> {
    const { host, username } = config;

    if (!host) {
      return this.prepareSSH2Config({
        ...config,
        host: 'localhost',
      });
    }

    if (host === 'localhost' && !username) {
      return this.prepareSSH2Config({
        ...config,
        username: os.userInfo().username,
      });
    }

    if ('privateKeyPath' in config && config.privateKeyPath) {
      const { privateKeyPath, ...rest } = config;
      const privateKey = await fs.readFile(privateKeyPath as string, 'utf8');

      return {
        privateKey,
        ...rest,
      };
    }

    return config;
  }

  isConnected() {
    return this.ssh.isConnected();
  }

  async connect() {
    try {
      if (this.isConnected()) {
        return this;
      }

      const ssh2Config = await this.prepareSSH2Config(this.config as SSHConnectionConfig);
      await this.ssh.connect(ssh2Config);

      await this.onConnected();

      return this;
    } catch (error) {
      console.error('Error connecting to server:', error);
      throw error;
    }
  }

  async exec(cmd: string) {
    try {
      await this.waitForConnection();

      logExec(cmd);
      const result = await this.ssh.execCommand(cmd);
      if (typeof result === 'undefined') {
        throw new Error('No response');
      }

      if (result.stdout) {
        logResponse(result.stdout);
      } else {
        logResponse('No response');
      }

      if (result.stderr) {
        logError(result.stderr);
        throw new Error(result.stderr);
      }

      return result.stdout;
    } catch (error) {
      logError(`Error executing command '${cmd}':`, error);
      throw error;
    }
  }

  async close() {
    await this.ssh.dispose();
    return this;
  }

  // file transfer
  private async getSFTP() {
    const sftpConfig = await this.prepareSSH2Config(this.config as SSHConnectionConfig);

    const sftp = new SFTPClient();
    await sftp.connect(sftpConfig);

    return sftp;
  }

  async put(localPath: string, remotePath: string, options?: PutOptions) {
    const sftp = await this.getSFTP();

    // use

    try {
      await sftp.put(localPath, remotePath, {
        writeStreamOptions: {
          ...defaultPutOptions,
          ...options,
        },
      });
    } finally {
      await sftp.end();
    }
  }

  async putContent(content: string | Buffer, remotePath: string, options?: PutOptions) {
    const sftp = await this.getSFTP();

    try {
      const bufferContent = Buffer.isBuffer(content) ? content : Buffer.from(content);
      await sftp.put(bufferContent, remotePath, {
        writeStreamOptions: {
          ...defaultPutOptions,
          ...options,
        },
      });
    } finally {
      await sftp.end();
    }
  }

  async get(remotePath: string, localPath: string, options?: GetOptions) {
    const sftp = await this.getSFTP();

    // use standard cat if sftp is not available

    try {
      await sftp.get(remotePath, localPath, {
        readStreamOptions: {
          autoClose: true,
          ...defaultGetOptions,
          ...options,
        },
      });
    } finally {
      await sftp.end();
    }
  }

  async getContent(remotePath: string, options?: GetOptions) {
    const sftp = await this.getSFTP();

    try {
      const stream = new InMemoryWriteStream();

      await sftp.get(remotePath, stream, {
        readStreamOptions: {
          autoClose: true,
          ...defaultGetOptions,
          ...options,
        },
      });

      const data = stream.getData();

      stream.destroy();

      return data;
    } finally {
      await sftp.end();
    }
  }
}
