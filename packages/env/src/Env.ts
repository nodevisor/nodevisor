import { Module, raw, type Nodevisor } from '@nodevisor/core';

export default class Env extends Module {
  constructor(nodevisor: Nodevisor) {
    super(nodevisor, {
      name: 'env',
    });
  }

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
    const { $, execEnv } = connection;

    if (!connection.isOriginal()) {
      const absPath = await fs.abs(connection, path);
      execEnv.addFile(absPath);
      return;
    }

    await $`set -a`;
    await $`source ${path}`;
    await $`set +a`;
  }
}
