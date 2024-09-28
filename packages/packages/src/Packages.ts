import { Module, Platform } from '@nodevisor/core';
import OS from '@nodevisor/os';
import PackageManager from './constants/PackageManager';

export default class Packages extends Module {
  readonly name = 'packages';
  readonly os = new OS(this.nodevisor);

  async packageManager() {
    return this.cached('packageManager', async () => {
      switch (await this.platform()) {
        case Platform.DARWIN:
          return PackageManager.BREW;
        case Platform.WINDOWS:
          return PackageManager.WINGET;
        default:
          const hasYUM = await this.os.commandExists('yum');
          if (hasYUM) {
            return PackageManager.YUM;
          }

          return PackageManager.APT;
      }
    });
  }

  async update() {
    switch (await this.packageManager()) {
      case PackageManager.BREW:
        return this.$`brew update`;
      case PackageManager.WINGET:
        // winget doesn't have a dedicated update command, upgrade covers it
        return;
      case PackageManager.YUM:
        return this.$`yum check-update`;
      default:
        return this.$`DEBIAN_FRONTEND=noninteractive apt-get update`;
    }
  }

  async upgrade() {
    switch (await this.packageManager()) {
      case PackageManager.BREW:
        return this.$`brew upgrade`;
      case PackageManager.WINGET:
        return this.$`winget upgrade --all`;
      case PackageManager.YUM:
        return this.$`yum upgrade -y`;
      default:
        return this.$`DEBIAN_FRONTEND=noninteractive apt-get upgrade -y`;
    }
  }

  async updateAndUpgrade() {
    await this.update();
    await this.upgrade();
  }

  async install(packages: string[] | string) {
    if (typeof packages === 'string') {
      await this.install([packages]);
      return;
    }

    // filter out already installed packages
    const installed = await Promise.all(packages.map(async (name) => this.isInstalled(name)));

    const notInstalled = packages.filter((_, index) => !installed[index]);
    if (!notInstalled.length) {
      return;
    }

    // update package list before installing, to avoid errors
    await this.update();

    switch (await this.packageManager()) {
      case PackageManager.BREW:
        await this.$`brew install ${notInstalled}`;
        break;
      case PackageManager.WINGET:
        await this.$`winget install ${notInstalled} --disable-interactivity`;
        break;
      case PackageManager.YUM:
        await this.$`yum install -y ${notInstalled}`;
        break;
      default:
        await this.$`DEBIAN_FRONTEND=noninteractive apt-get install -y ${notInstalled}`;
        break;
    }
  }

  async uninstall(name: string) {
    if (!(await this.isInstalled(name))) {
      return;
    }

    switch (await this.packageManager()) {
      case PackageManager.BREW:
        await this.$`brew uninstall ${name}`;
        break;
      case PackageManager.WINGET:
        await this.$`winget uninstall ${name} --disable-interactivity`;
        break;
      case PackageManager.YUM:
        await this.$`yum remove -y ${name}`;
        break;
      case PackageManager.APT:
        await this.$`DEBIAN_FRONTEND=noninteractive apt-get remove -y ${name}`;
        break;
    }

    if (await this.isInstalled(name)) {
      throw new Error(`Failed to uninstall package ${name}`);
    }
  }

  async isInstalled(name: string) {
    switch (await this.packageManager()) {
      case PackageManager.BREW:
        const darwinLines = await this.$`brew ls --versions ${name}`.noThrow().toLines();
        return !!darwinLines.length;
      case PackageManager.WINGET:
        const wingetResponse = await this.$`winget list ${name}`.toLines();
        return wingetResponse.some((line) => line.includes(name));
      case PackageManager.YUM:
        const yumLines = await this.$`yum list installed ${name}`.noThrow().toLines();
        return yumLines.some((line) => line.includes(name));
      case PackageManager.APT:
        /*
        // we can use dpkg to check if the package is installed
        const aptLines = await this.$`dpkg -s ${name} | grep Status`.toLines();
        // filter out lines that contain "install ok installed"
        const aptLinesFiltered = aptLines.filter((line) => line.includes('install ok installed'));
        return !!aptLinesFiltered.length;
        */
        const aptLines = await this.$`apt-cache policy ${name} | grep Installed`.toLines();
        // filter out lines that contain "Installed: (none)"
        const aptLinesFiltered = aptLines.filter((line) => !line.includes('Installed: (none)'));
        return !!aptLinesFiltered.length;
    }
  }

  async isUpgradable(name: string) {
    switch (await this.packageManager()) {
      case PackageManager.BREW:
        /*
        % brew outdated httpd
        % brew outdated curl
        curl (8.7.1) < 8.10.0

        Warning: Treating httpie as a formula. For the cask, use homebrew/cask/httpie or specify the `--cask` flag. To silence this message, use the `--formula` flag.
        */
        const darwinLines = await this.$`brew outdated ${name} --formula`.toLines();
        const relevantLines = darwinLines.filter((line) => !line.includes('Downloading'));

        return !!relevantLines.length;
      case PackageManager.WINGET:
        const wingetUpgradeCheck = await this.$`winget upgrade --source winget`.toLines();
        return wingetUpgradeCheck.some((line) => line.includes(name));
      /*
        const wingetResponse = await this
          .$`winget list ${name} --upgrade-available --source winget`.toLines();
        return !!wingetResponse.length;
        */
      case PackageManager.YUM:
        const yumUpgradable = await this.$`yum list updates ${name}`.noThrow().toLines();
        return !!yumUpgradable.length;
      case PackageManager.APT:
        const aptUpgradable = await this.$`apt list --upgradable ${name}`.toLines();
        return !!aptUpgradable.length;
    }
  }

  // throw if package is not installed
  async requireInstalled(name: string) {
    if (!(await this.isInstalled(name))) {
      throw new Error(`Package ${name} is not installed`);
    }
  }
}
