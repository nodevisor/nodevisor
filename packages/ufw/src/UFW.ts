import { Service } from '@nodevisor/shell';
import Packages, { PackageManager } from '@nodevisor/packages';
import { Protocol, type Endpoint } from '@nodevisor/endpoint';

export default class UFW extends Service {
  readonly name = 'ufw';

  readonly packages = new Packages(this.nodevisor);

  // package version methods
  async getVersion() {
    if (!(await this.isInstalled())) {
      throw new Error('ufw is not installed');
    }

    return await this.$`ufw --version`.text();
  }

  async isInstalled() {
    try {
      const response = await this.$`ufw --version`.text();

      return response.includes('ufw version');
    } catch (error) {
      return false;
    }
  }

  async installPackage() {
    switch (await this.packages.packageManager()) {
      case PackageManager.APT:
        await this.packages.install('ufw');
        break;
      default:
        throw new Error('Unsupported package manager');
    }
  }

  async uninstallPackage() {
    switch (await this.packages.packageManager()) {
      case PackageManager.APT:
        await this.packages.uninstall('ufw');
        break;
      default:
        throw new Error('Unsupported package manager');
    }
  }

  // service methods
  async isRunning() {
    const status = await this.$`ufw status`.text();

    return status.startsWith('Status: active');
  }

  async start() {
    await this.$`yes | ufw enable`;
  }

  async stop() {
    await this.$`yes | ufw disable`;
  }

  // allow

  async allow(endpoint: Endpoint | Endpoint[]) {
    const endpoints = Array.isArray(endpoint) ? endpoint : [endpoint];

    // run in serial, parallel will break config file and override rules
    for (const endpoint of endpoints) {
      const { port, protocol = Protocol.TCP } = endpoint;
      await this.$`ufw allow ${port}/${protocol}`.text();
    }
  }

  async deleteAllow(endpoint: Endpoint) {
    const { port, protocol = Protocol.TCP } = endpoint;

    await this.$`ufw delete allow ${port}/${protocol}`.text();
  }

  /*
  sudo ufw status
  Firewall loaded
  
  To                         Action  From
  --                         ------  ----
  22:tcp                     DENY    192.168.0.1
  22:udp                     DENY    192.168.0.1
  22:tcp                     DENY    192.168.0.7
  22:udp                     DENY    192.168.0.7
  22:tcp                     ALLOW   192.168.0.0/24
  */
  async isAllowed(endpoint: Endpoint) {
    const { port, protocol = Protocol.TCP } = endpoint;

    const status = await this.$`ufw status`.text();

    const lines = status.split('\n');
    return lines.some(
      (line) => line.includes(`${port}/${protocol}`) && /ALLOW/.test(line),
    );
  }
}
