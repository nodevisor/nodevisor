import { Module, type Nodevisor } from '@nodevisor/core';

export default class Packages extends Module {
  constructor(nodevisor: Nodevisor) {
    super(nodevisor, {
      name: 'packages',
    });
  }

  async update() {
    return this.$`DEBIAN_FRONTEND=noninteractive apt-get update`;
  }

  async upgrade() {
    return this.$`DEBIAN_FRONTEND=noninteractive apt-get upgrade -y`;
  }

  async updateAndUpgrade() {
    await this.update();

    return this.upgrade();
  }

  async install(packages: string[] | string) {
    if (typeof packages === 'string') {
      this.install([packages]);
      return;
    }

    // filter out already installed packages
    const installed = await Promise.all(packages.map(async (name) => this.isInstalled(name)));

    const notInstalled = packages.filter((_, index) => !installed[index]);

    if (!notInstalled.length) {
      return;
    }

    await this.$`DEBIAN_FRONTEND=noninteractive apt-get install -y ${packages}`;
  }

  async uninstall(name: string) {
    if (!(await this.isInstalled(name))) {
      return true;
    }

    await this.$`DEBIAN_FRONTEND=noninteractive apt-get remove -y ${name}`;
    return true;
  }

  async isInstalled(name: string) {
    const lines = await this.$`apt-cache policy ${name} | grep Installed`.toLines();
    console.log('lines', lines);

    return !!lines.length;
  }

  // throw if package is not installed
  async requireInstalled(name: string) {
    if (!(await this.isInstalled(name))) {
      throw new Error(`Package ${name} is not installed`);
    }
  }

  async isUpgradable(name: string) {
    const lines = await this.$`apt list --upgradable ${name}`.toLines();

    return !!lines.length;
  }
}
