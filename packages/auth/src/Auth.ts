import { Module, type Nodevisor, log as defaultLog } from '@nodevisor/core';
// import { Users } from '@nodevisor/users';
import { FS } from '@nodevisor/fs';

const log = defaultLog.extend('auth');

export default class Auth extends Module {
  constructor(nodevisor: Nodevisor) {
    super(nodevisor, {
      name: 'auth',
    });
  }

  async logout() {
    return this.$`logout`;
  }

  async login(username: string) {
    throw new Error('Not implemented');
    /*
    const users = this.getModule(Users);
    if ((await users.whoami()) === username) {
      return;
    }

    await this.$`su - ${username}`;

    if ((await users.whoami()) !== username) {
      throw new Error('Failed to login');
    }
      */
  }

  async setPassword(username: string, password: string) {
    const fs = this.getModule(FS);

    const remotePath = await fs.temp();

    try {
      await fs.writeFile(remotePath, `${username}:${password}`);

      await this.$`chpasswd < "${remotePath}"`;
    } finally {
      await fs.rm(remotePath);
    }
  }
}
