import { NodeSSH } from 'node-ssh';
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
import CommandOutputError from '../errors/CommandOutputError';
import CommandOutput from '../commands/CommandOutput';
import User, { type UserConfig } from '../User';
import { ShellOptions } from 'ssh2';

const log = baseLog.extend('ssh-connection');
const logExec = log.extend('exec');
const logResponse = log.extend('response');
const logError = log.extend('error');

export type SSHConnectionConfig = ConnectionConfig & UserConfig;

export default class SSHConnection extends Connection {
  private ssh: NodeSSH;
  private user: User;

  constructor(config: SSHConnectionConfig) {
    super(config);

    this.user = new User(config);
    this.ssh = new NodeSSH();
  }

  isConnected() {
    return this.ssh.isConnected();
  }

  async connect() {
    try {
      if (this.isConnected()) {
        return this;
      }

      const config = await this.user.getNodeSSHConfig();

      await this.ssh.connect(config);

      await this.onConnected();

      return this;
    } catch (error) {
      console.error('Error connecting to server:', error);
      throw error;
    }
  }

  async exec(cmd: string, options: { stdin?: string; signal?: AbortSignal } = {}) {
    const { stdin, signal } = options;

    return new Promise<CommandOutput>(async (resolve, reject) => {
      let fullfilled = false;

      function handleError(error: Error) {
        if (fullfilled) {
          return;
        }

        fullfilled = true;
        reject(error);
      }

      function handleResult(result: CommandOutput) {
        if (fullfilled) {
          return;
        }

        fullfilled = true;
        resolve(result);
      }

      if (signal) {
        signal.addEventListener('abort', () => {
          handleError(new Error(signal.reason || 'Command aborted'));
        });
      }

      try {
        await this.waitForConnection();

        const start = Date.now();

        if (stdin) {
          logExec(`${cmd} | ${stdin}`);
        } else {
          logExec(cmd);
        }

        const { stdout, stderr, code } = await this.ssh.execCommand(cmd, {
          stdin: stdin ? `${stdin}` : undefined,
          noTrim: true,
        });
        logResponse(`stdout: ${JSON.stringify(stdout)}`);
        logResponse(`stdout: ${stdout}, stderr: ${stderr}, code: ${code}`);

        const outputConfig = {
          stdout,
          stderr,
          code,
          duration: Date.now() - start,
        };

        if (code !== 0) {
          throw new CommandOutputError(outputConfig);
        }

        const result = new CommandOutput(outputConfig);

        handleResult(result);
      } catch (error) {
        if (!(error instanceof CommandOutputError)) {
          logError(`Error executing command '${cmd}':`, error);
        }

        handleError(error as Error);
      }
    });
  }

  async close() {
    await this.ssh.dispose();
    return this;
  }

  // file transfer
  private async getSFTP() {
    const sftpConfig = await this.user.getNodeSSHConfig();

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

  async requestShell(options?: ShellOptions) {
    return await this.ssh.requestShell({
      ...options,
    });
  }
}
