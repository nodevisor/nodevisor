import { Module } from '@nodevisor/core';

export default class Users extends Module {
  readonly name = 'users';

  async whoami() {
    return this.$`whoami`;
  }

  async exists(username: string) {
    return this.$`id -u ${username}`.boolean(true);
  }

  async add(username: string) {
    if (await this.exists(username)) {
      this.log(`User ${username} already exists`);
      return;
    }

    await this.$`adduser ${username}`;
    if (!(await this.exists(username))) {
      throw new Error(`Failed to add user ${username}`);
    }
  }

  async remove(username: string) {
    if (!(await this.exists(username))) {
      return;
    }

    await this.$`deluser ${username}`;
    if (await this.exists(username)) {
      throw new Error(`Failed to remove user ${username}`);
    }
  }
}
