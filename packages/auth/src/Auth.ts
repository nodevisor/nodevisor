import { Module } from '@nodevisor/core';
// import { Users } from '@nodevisor/users';
import fs from '@nodevisor/fs';

export default class Auth extends Module {
  readonly name = 'auth';
  readonly fs = this.module(fs);

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
    const remotePath = await this.fs.temp();

    try {
      await this.fs.writeFile(remotePath, `${username}:${password}`);

      await this.$`chpasswd < "${remotePath}"`;
    } finally {
      await this.fs.rm(remotePath);
    }
  }
}
