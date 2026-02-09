import { Module } from '@nodevisor/shell';

export default class Services extends Module {
  readonly name = 'services';

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
    return this.$`systemctl is-active ${name}`.boolean(true);
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
    return this.$`systemctl --no-pager status ${name}`.text();
  }
}
