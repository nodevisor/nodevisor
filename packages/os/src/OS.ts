import { Module, type Nodevisor } from '@nodevisor/core';

export default class OS extends Module {
  constructor(nodevisor: Nodevisor) {
    super(nodevisor, {
      name: 'os',
    });
  }

  async reboot() {
    return this.$`reboot`;
  }

  async shutdown() {
    return this.$`shutdown now`;
  }

  async uptime() {
    return this.$`uptime`;
  }

  async hostname() {
    return this.$`hostname`;
  }

  async arch() {
    return this.$`uname -m`;
  }

  async platform() {
    return this.$`uname -s`;
  }
}
