import { Service, type Nodevisor } from '@nodevisor/core';
import { Groups } from '@nodevisor/groups';
import { Packages } from '@nodevisor/packages';
import { Services } from '@nodevisor/services';
import { FS } from '@nodevisor/fs';

export default class Docker extends Service {
  constructor(nodevisor: Nodevisor) {
    super(nodevisor, {
      name: 'docker',
    });
  }

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
    const packages = this.getModule(Packages);
    const fs = this.getModule(FS);

    // install docker
    await packages.install([
      'apt-transport-https',
      'ca-certificates',
      'software-properties-common',
      'gnupg2',
      'curl',
    ]);

    await fs.mkdir(`/etc/apt/keyrings`);

    await this
      .$`curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc`;

    await this.$`chmod a+r /etc/apt/keyrings/docker.asc`;

    await this
      .$`echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null`;

    // update the package database with the Docker packages from the newly added repo
    await packages.update();

    // install docker
    await packages.install(['docker-ce', 'docker-ce-cli', 'containerd.io']);

    await this.start();
  }

  async uninstallPackage() {
    throw new Error('Not implemented');
  }

  // service methods
  async isRunning() {
    const services = this.getModule(Services);
    const status = await services.status('docker');

    return !!status?.includes('active (running)');
  }

  async start() {
    const services = this.getModule(Services);
    await services.start('docker');
    return this;
  }

  async stop() {
    const services = this.getModule(Services);
    await services.stop('docker');
    return this;
  }

  // user methods
  // allow username to run docker commands without sudo
  async allowUser(username: string) {
    const groups = this.getModule(Groups);
    const isUserInGroup = await groups.hasUser(username, 'docker');
    if (isUserInGroup) {
      this.log(`User ${username} is already in docker group`);
      return;
    }

    await groups.addUser(username, 'docker');
  }
}
