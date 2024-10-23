import fs from 'node:fs/promises';
import $, { expandHomeDir } from '@nodevisor/core';
import type SSH from './@types/SSH';

export default class ClusterUser {
  ssh: SSH;

  constructor(ssh: SSH) {
    this.ssh = ssh;
  }

  get username() {
    return this.ssh.username;
  }

  get password() {
    return 'password' in this.ssh ? (this.ssh.password as string) : undefined;
  }

  async getPrivateKey(): Promise<string | undefined> {
    const { ssh } = this;

    if ('privateKey' in ssh && ssh.privateKey) {
      return ssh.privateKey as string;
    }

    if ('privateKeyPath' in ssh && ssh.privateKeyPath) {
      const { privateKeyPath } = ssh;

      return await fs.readFile(expandHomeDir(privateKeyPath as string), 'utf8');
    }

    return undefined;
  }

  async getPublicKey(): Promise<string | undefined> {
    const { ssh } = this;

    if ('publicKey' in ssh && ssh.publicKey) {
      return ssh.publicKey;
    }

    if ('publicKeyPath' in ssh && ssh.publicKeyPath) {
      const { publicKeyPath } = ssh;

      return await fs.readFile(expandHomeDir(publicKeyPath), 'utf8');
    }

    if ('privateKeyPath' in ssh && ssh.privateKeyPath) {
      const { privateKeyPath } = ssh;

      return await fs.readFile(expandHomeDir(`${privateKeyPath}.pub`), 'utf8');
    }

    return undefined;
  }

  async connect(host: string) {
    const privateKey = await this.getPrivateKey();

    if (privateKey) {
      return $.connect({
        host,
        username: this.username,
        password: this.password,
        privateKey,
      });
    }

    return $.connect({
      host,
      username: this.username,
      password: this.password,
    });
  }

  clone(username: string, password?: string) {
    return new ClusterUser({
      ...this.ssh,
      password,
      username,
    });
  }
}
