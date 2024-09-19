import { Module, raw } from '@nodevisor/core';

export default class Env extends Module {
  readonly name = 'env';

  async get(name: string) {
    return this.$`echo $${raw(name)}`;
  }

  async set(name: string, value: string) {
    await this.$`export ${raw(name)}=${value}`;
  }

  async home() {
    const value = await this.get('HOME');
    if (!value) {
      throw new Error('HOME environment variable not set');
    }

    return value;
  }

  async load(path: string) {
    await this.$`set -a`;
    await this.$`source ${path}`;
    await this.$`set +a`;
  }
}
