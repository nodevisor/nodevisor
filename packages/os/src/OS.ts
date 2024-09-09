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

  async uptime(): Promise<number> {
    const platform = await this.platform();
    if (platform === 'linux') {
      const value = await this.$`cat /proc/uptime`.trim();

      const [seconds] = value.split(' ');
      if (!seconds) {
        throw new Error('Unable to parse uptime');
      }

      return parseFloat(seconds);
    } else if (platform === 'darwin') {
      const str = await this.$`sysctl -n kern.boottime`.trim();

      const match = str.match(/sec\s*=\s*(\d+)/);
      if (!match) {
        throw new Error('Unable to parse uptime');
      }

      const bootTime = parseInt(match[1] as string, 10);
      const now = Date.now() / 1000;

      return now - bootTime;
    }

    throw new Error('Unsupported platform');
  }

  async hostname() {
    const platform = await this.platform();
    if (platform === 'linux') {
      return this.$`cat /proc/sys/kernel/hostname`.trim();
    }

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
