import { Module, Platform } from '@nodevisor/core';
import Arch from './constants/Arch';
import PWSH from '@nodevisor/pwsh';

const archs = Object.values(Arch) as string[];

export default class OS extends Module {
  readonly name = 'os';
  readonly pwsh = new PWSH(this.nodevisor);

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
        const macValue = await this.$`sysctl -n kern.boottime`.text();

        const match = macValue.match(/sec\s*=\s*(\d+)/);
        if (!match) {
          throw new Error('Unable to parse uptime');
        }

        const macBootTime = parseInt(match[1] as string, 10);

        return now - macBootTime;
      case Platform.WINDOWS:
        const winValue = await this.pwsh
          .command`(Get-CimInstance Win32_OperatingSystem).LastBootUpTime`.text();
        const winBootTime = new Date(winValue).getTime() / 1000;

        return now - winBootTime;
      default:
        const value = await this.$`cat /proc/uptime`.text();

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
        return this.$`hostname`.text();
      case Platform.WINDOWS:
        return this.pwsh.command`[System.Net.Dns]::GetHostName()`.text();
      default:
        return this.$`cat /proc/sys/kernel/hostname`.text();
    }
  }

  async arch() {
    switch (await this.platform()) {
      case Platform.WINDOWS:
        const winValue = await this.pwsh
          .command`(Get-WmiObject Win32_OperatingSystem).OSArchitecture`
          .toLowerCase()
          .text();
        return winValue.includes('64') ? 'x64' : 'x86';
      default:
        const value = await this.$`uname -m`.toLowerCase().text();

        if (archs.includes(value)) {
          return value as Arch;
        }

        return value;
    }
  }

  async commandExists(command: string) {
    switch (await this.platform()) {
      case Platform.WINDOWS:
        return await this.pwsh
          .command`Get-Command ${command} -ErrorAction SilentlyContinue`.boolean(true);
      default:
        // can be replaced with `which ${command}`.toBoolean(true)
        return await this.$`command -v ${command}`.boolean(true);
    }
  }
}
