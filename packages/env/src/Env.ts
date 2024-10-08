import { Module } from '@nodevisor/core';

export default class Env extends Module {
  readonly name = 'env';

  async get(name: string) {
    // read env from nodevisor command because it will read value from system
    return this.nodevisor.cmd().getEnv(name);
  }

  async set(name: string, value: string | undefined) {
    // we set value in nodevisor directly, it will be passed to each command
    await this.nodevisor.env.set(name, value);
  }

  async unset(name: string) {
    await this.set(name, undefined);
  }

  async home() {
    const value = await this.get('HOME');
    if (!value) {
      throw new Error('HOME environment variable not set');
    }

    return value;
  }

  async load(path: string) {
    await this.nodevisor.env.addFile(path);
  }
}
