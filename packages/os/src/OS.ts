import { Module, type Nodevisor } from '@nodevisor/core';
import Arch from './constants/Arch';

const archs = Object.values(Arch) as string[];

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
    return this.$`uptime`.trim();
  }

  async hostname() {
    return this.$`hostname`.trim();
  }

  async arch() {
    const arch = await this.$`uname -m`.trim().toLowerCase();

    if (archs.includes(arch)) {
      return arch as Arch;
    }

    return arch;
  }

  async platform() {
    return this.$`uname -s`.trim().toLowerCase();
  }
}
