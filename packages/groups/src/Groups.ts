import { Module, type Nodevisor } from '@nodevisor/core';

export default class Groups extends Module {
  constructor(nodevisor: Nodevisor) {
    super(nodevisor, {
      name: 'groups',
    });
  }

  async exists(name: string) {
    return this.$`getent group ${name}`.boolean(true);
  }

  async add(name: string): Promise<void> {
    if (await this.exists(name)) {
      return;
    }

    await this.$`groupadd ${name}`;

    if (!(await this.exists(name))) {
      throw new Error(`Failed to add group ${name}`);
    }
  }

  async remove(name: string) {
    if (!(await this.exists(name))) {
      return;
    }

    await this.$`groupdel ${name}`;

    if (await this.exists(name)) {
      throw new Error(`Failed to remove group ${name}`);
    }
  }

  async addUser(username: string, group: string) {
    await this.$`usermod -aG ${group} ${username}`;

    if (!(await this.hasUser(username, group))) {
      throw new Error(`Failed to add user ${username} to group ${group}`);
    }
  }

  async removeUser(username: string, group: string) {
    await this.$`gpasswd -d ${username} ${group}`;

    if (await this.hasUser(username, group)) {
      throw new Error(`Failed to remove user ${username} from group ${group}`);
    }
  }

  async userGroups(username: string) {
    const items = await this.$`id -Gn ${username}`;

    return items.split(' ').map((item: string) => item.trim());
  }

  async hasUser(username: string, group: string) {
    const list = await this.userGroups(username);

    return list.includes(group);
  }
}
