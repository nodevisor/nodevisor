import fs from 'node:fs/promises';
import os from 'node:os';
import { type Config as NodeSSHConfig } from 'node-ssh';
import expandHomeDir from './utils/expandHomeDir';
import { cloneDeep } from 'lodash';

export type UserConfig = {
  host: string;

  username?: string;

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
) &
  (
    | {
        publicKey?: string;
      }
    | {
        publicKeyPath?: string;
      }
  );

export default class User {
  private config: UserConfig;

  static getLocalhostUser() {
    return new User({
      host: '127.0.0.1',
      username: os.userInfo().username,
    });
  }

  constructor(config: UserConfig) {
    this.config = config;
  }

  get username() {
    return this.config.username;
  }

  get password() {
    return 'password' in this.config ? this.config.password : undefined;
  }

  async getPrivateKey() {
    const { config } = this;

    if ('privateKey' in config && config.privateKey) {
      return config.privateKey;
    }

    if ('privateKeyPath' in config && config.privateKeyPath) {
      const { privateKeyPath } = config;

      return await fs.readFile(expandHomeDir(privateKeyPath), 'utf8');
    }

    return undefined;
  }

  async getPublicKey() {
    const { config } = this;

    if ('publicKey' in config && config.publicKey) {
      return config.publicKey;
    }

    if ('publicKeyPath' in config && config.publicKeyPath) {
      const { publicKeyPath } = config;

      return await fs.readFile(expandHomeDir(publicKeyPath), 'utf8');
    }

    if ('privateKeyPath' in config && config.privateKeyPath) {
      const { privateKeyPath } = config;

      return await fs.readFile(expandHomeDir(`${privateKeyPath}.pub`), 'utf8');
    }

    return undefined;
  }

  clone(overrides: Partial<UserConfig> = {}) {
    return new User({
      ...this.config,
      ...overrides,
    });
  }

  getSSHConnectionConfig() {
    return cloneDeep(this.config);
  }

  async getNodeSSHConfig(): Promise<NodeSSHConfig> {
    const { host, username, port, forceIPv4, forceIPv6, agent, readyTimeout } = this.config;

    const config = {
      host,
      username,

      password: this.password,
      privateKey: await this.getPrivateKey(),

      port,
      forceIPv4,
      forceIPv6,
      agent,
      readyTimeout,
    };

    // remove undefined values
    return Object.fromEntries(Object.entries(config).filter(([, value]) => value !== undefined));
  }
}
