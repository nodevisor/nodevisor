import { Service } from '@nodevisor/core';
import groups from '@nodevisor/groups';
import packages from '@nodevisor/packages';
import services from '@nodevisor/services';
import fs from '@nodevisor/fs';

export default class Docker extends Service {
  readonly name = 'docker';

  readonly packages = this.module(packages);
  readonly services = this.module(services);
  readonly fs = this.module(fs);
  readonly groups = this.module(groups);

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
    // install docker
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
