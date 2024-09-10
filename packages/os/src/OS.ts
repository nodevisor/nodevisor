import { Module, type Nodevisor } from '@nodevisor/core';
import Arch from './constants/Arch';
import Platform from './constants/Platform';

const archs = Object.values(Arch) as string[];
const platforms = Object.values(Platform) as string[];

export default class OS extends Module {
  constructor(nodevisor: Nodevisor) {
    super(nodevisor, {
      name: 'os',
    });
  }

  async reboot() {
    const platform = await this.platform();
    if ([Platform.LINUX, Platform.DARWIN].includes(platform)) {
      return this.$`reboot`;
    } else if (platform === 'win32') {
      return this.$`shutdown /r /t 0`;
    }

    throw new Error('Unsupported platform');
  }

  async shutdown() {
    const platform = await this.platform();
    if ([Platform.LINUX, Platform.DARWIN].includes(platform)) {
      return this.$`shutdown now`;
    } else if (platform === 'win32') {
      return this.$`shutdown /s /t 0`;
    }

    throw new Error('Unsupported platform');
  }

  async uptime(): Promise<number> {
    const platform = await this.platform();
    if (platform === Platform.LINUX) {
      const value = await this.$`cat /proc/uptime`;

      const [seconds] = value.split(' ');
      if (!seconds) {
        throw new Error('Unable to parse uptime');
      }

      return parseFloat(seconds);
    } else if (platform === Platform.DARWIN) {
      const str = await this.$`sysctl -n kern.boottime`;

      const match = str.match(/sec\s*=\s*(\d+)/);
      if (!match) {
        throw new Error('Unable to parse uptime');
      }

      const bootTime = parseInt(match[1] as string, 10);
      const now = Date.now() / 1000;

      return now - bootTime;
    } else if (platform === Platform.WINDOWS) {
      const uptimeStr = await this
        .$`powershell -command "(Get-CimInstance Win32_OperatingSystem).LastBootUpTime"`;
      const bootTime = new Date(uptimeStr).getTime() / 1000;
      const now = Date.now() / 1000;
      return now - bootTime;
    }

    throw new Error('Unsupported platform');
  }

  async hostname() {
    const platform = await this.platform();
    if (platform === Platform.LINUX) {
      return this.$`cat /proc/sys/kernel/hostname`;
    } else if (platform === Platform.DARWIN) {
      return this.$`hostname`;
    } else if (platform === Platform.WINDOWS) {
      return this.$`powershell -command "[System.Net.Dns]::GetHostName()"`;
    }

    throw new Error('Unsupported platform');
  }

  async arch() {
    const platform = await this.platform();

    if ([Platform.LINUX, Platform.DARWIN].includes(platform)) {
      const arch = await this.$`uname -m`.toLowerCase();

      if (archs.includes(arch)) {
        return arch as Arch;
      }

      return arch;
    } else if (platform === Platform.WINDOWS) {
      const arch = await this
        .$`powershell -command "(Get-WmiObject Win32_OperatingSystem).OSArchitecture"`.toLowerCase();
      return arch.includes('64') ? 'x64' : 'x86';
    }

    throw new Error('Unsupported platform');
  }

  async platform(): Promise<Platform> {
    return this.cached<Platform>('platform', async () => {
      try {
        const platform = await this.$`uname -s`.toLowerCase();

        if (platforms.includes(platform)) {
          return platform as Platform;
        }

        if (platform.includes('mingw') || platform.includes('cygwin')) {
          return Platform.WINDOWS;
        }

        throw new Error('Unsupported platform');
      } catch (error) {
        const platform = await this
          .$`powershell -command "(Get-WmiObject Win32_OperatingSystem).Caption"`;

        if (platforms.includes(platform)) {
          return platform as Platform;
        }

        if (platform.includes('Windows')) {
          return Platform.WINDOWS;
        }
      }

      throw new Error('Unsupported platform');
    });
  }
}
