import { Service } from '@nodevisor/core';
import Groups from '@nodevisor/groups';
import Packages, { PackageManager } from '@nodevisor/packages';
import Services from '@nodevisor/services';
import FS from '@nodevisor/fs';

export default class UFW extends Service {
  readonly name = 'ufw';

  readonly packages = new Packages(this.nodevisor);
  readonly services = new Services(this.nodevisor);

  // package version methods
  async getVersion() {
    return this.$`aws --version`;
  }

  async isInstalled() {
    const response = await this.$`docker --version`;

    return response.includes('Docker version');
  }

  async update() {
    throw new Error('Not implemented');
    return this;
  }

  async installPackage() {
    switch (await this.packages.packageManager()) {
      case PackageManager.APT:
        await this.packages.install([
          'apt-transport-https',
          'ca-certificates',
          'software-properties-common',
          'gnupg2',
          'curl',
        ]);

        await this.fs.mkdir(`/etc/apt/keyrings`);

        await this
          .$`curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc`;

        await this.$`chmod a+r /etc/apt/keyrings/docker.asc`;

        await this
          .$`echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null`;

        // update the package database with the Docker packages from the newly added repo
        await this.packages.update();

        // install docker
        await this.packages.install(['docker-ce', 'docker-ce-cli', 'containerd.io']);

        await this.start();
        break;
      default:
        throw new Error(`Unsupported package manager: ${await this.packages.packageManager()}`);
    }
  }

  async uninstallPackage() {
    throw new Error('Not implemented');
  }

  // service methods
  async isRunning() {
    const status = await this.services.status('docker');

    return !!status?.includes('active (running)');
  }

  async start() {
    await this.services.start('docker');
    return this;
  }

  async stop() {
    await this.services.stop('docker');
    return this;
  }

  // user methods
  // allow username to run docker commands without sudo
  async allowUser(username: string) {
    const isUserInGroup = await this.groups.hasUser(username, 'docker');
    if (isUserInGroup) {
      this.log(`User ${username} is already in docker group`);
      return;
    }

    await this.groups.addUser(username, 'docker');
  }
}
