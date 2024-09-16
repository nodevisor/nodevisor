import { Module, type Nodevisor, Platform } from '@nodevisor/core';
import Arch from './constants/Arch';

const archs = Object.values(Arch) as string[];

export default class OS extends Module {
  constructor(nodevisor: Nodevisor) {
    super(nodevisor, {
      name: 'os',
    });
  }

  async reboot() {
    switch (await this.platform()) {
      case Platform.WINDOWS:
        return this.$`shutdown /r /t 0`;
      default:
        return this.$`reboot`;
    }
  }

  async shutdown() {
    switch (await this.platform()) {
      case Platform.WINDOWS:
        return this.$`shutdown /s /t 0`;
      default:
        return this.$`shutdown now`;
    }
  }

  async uptime(): Promise<number> {
    const now = Date.now() / 1000;

    switch (await this.platform()) {
      case Platform.DARWIN:
        const macValue = await this.$`sysctl -n kern.boottime`;

        const match = macValue.match(/sec\s*=\s*(\d+)/);
        if (!match) {
          throw new Error('Unable to parse uptime');
        }

        const macBootTime = parseInt(match[1] as string, 10);

        return now - macBootTime;
      case Platform.WINDOWS:
        const winValue = await this
          .$`powershell -command "(Get-CimInstance Win32_OperatingSystem).LastBootUpTime"`;
        const winBootTime = new Date(winValue).getTime() / 1000;

        return now - winBootTime;
      default:
        const value = await this.$`cat /proc/uptime`;

        const [seconds] = value.split(' ');
        if (!seconds) {
          throw new Error('Unable to parse uptime');
        }

        return parseFloat(seconds);
    }
  }

  async hostname() {
    switch (await this.platform()) {
      case Platform.DARWIN:
        return this.$`hostname`;
      case Platform.WINDOWS:
        return this.$`powershell -command "[System.Net.Dns]::GetHostName()"`;
      default:
        return this.$`cat /proc/sys/kernel/hostname`;
    }
  }

  async arch() {
    switch (await this.platform()) {
      case Platform.WINDOWS:
        const winValue = await this
          .$`powershell -command "(Get-WmiObject Win32_OperatingSystem).OSArchitecture"`.toLowerCase();
        return winValue.includes('64') ? 'x64' : 'x86';
      default:
        const value = await this.$`uname -m`.toLowerCase();

        if (archs.includes(value)) {
          return value as Arch;
        }

        return value;
    }
  }
}
