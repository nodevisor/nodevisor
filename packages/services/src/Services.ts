import { Module, type Nodevisor } from '@nodevisor/core';

export default class Services extends Module {
  constructor(nodevisor: Nodevisor) {
    super(nodevisor, {
      name: 'services',
    });
  }

  async start(name: string) {
    if (await this.isRunning(name)) {
      return;
    }

    this.$`systemctl start ${name}`;
  }

  async stop(name: string) {
    if (!(await this.isRunning(name))) {
      return;
    }

    await this.$`systemctl stop ${name}`;

    if (await this.isRunning(name)) {
      throw new Error(`Failed to stop service ${name}`);
    }
  }

  async isRunning(name: string) {
    return this.$`systemctl is-active ${name}`.toBoolean(true);
  }

  async restart(name: string) {
    if (!(await this.isRunning(name))) {
      return this.start(name);
    }

    await this.$`systemctl restart ${name}`;
    if (!(await this.isRunning(name))) {
      throw new Error(`Failed to restart service ${name}`);
    }
  }

  async status(name: string) {
    return this.$`systemctl --no-pager status ${name}`;
  }
}
