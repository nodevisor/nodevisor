import { Module } from '@nodevisor/shell';
// import Users from '@nodevisor/users';

export default class Auth extends Module {
  readonly name = 'auth';
  // readonly users = new Users(this.nodevisor);

  async logout() {
    return this.$`logout`;
  }

  async login(username: string) {
    throw new Error('Not implemented');
    /*
    if ((await this.users.whoami()) === username) {
      return;
    }

    await this.$`su - ${username}`;

    if ((await this.users.whoami()) !== username) {
      throw new Error('Failed to login');
    }
      */
  }

  async setPassword(username: string, password: string) {
    const content = `${username}:${password}`;

    await this.$`chpasswd`.stdin(content);
  }
}
