import { Service } from '@nodevisor/core';
import Groups from '@nodevisor/groups';
import Packages, { PackageManager } from '@nodevisor/packages';
import Services from '@nodevisor/services';
import FS from '@nodevisor/fs';

export default class Docker extends Service {
  readonly name = 'docker';

  readonly packages = new Packages(this.nodevisor);
  readonly services = new Services(this.nodevisor);
  readonly fs = new FS(this.nodevisor);
  readonly groups = new Groups(this.nodevisor);

  // package version methods
  async getVersion() {
    if (!(await this.isInstalled())) {
      throw new Error('docker is not installed');
    }

    return this.$`docker --version`.text();
  }

  async isInstalled() {
    try {
      const response = await this.$`docker --version`.text();

      return response.includes('Docker version');
    } catch (error) {
      return false;
    }
  }

  async installPackage() {
    switch (await this.packages.packageManager()) {
      case PackageManager.BREW:
        await this.packages.install('docker');
        break;
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
        throw new Error('Unsupported package manager');
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
  }

  async stop() {
    await this.services.stop('docker');
  }

  async restart() {
    await this.services.restart('docker');
  }

  // user methods
  // allow username to run docker commands without sudo
  async allowUser(username: string, skipRestart = false) {
    const isUserInGroup = await this.groups.hasUser(username, 'docker');
    if (isUserInGroup) {
      this.log(`User ${username} is already in docker group`);
      return;
    }

    await this.groups.addUser(username, 'docker');

    // restart docker service to apply changes, otherwise user will not be able to run docker commands without sudo
    if (!skipRestart) {
      await this.restart();
    }
  }

  async login(options: { username: string; password: string; server: string }): Promise<void> {
    const { username, password, server } = options;

    const response = await this.$`docker login --username ${username} --password-stdin ${server}`
      .stdin(password)
      .text();

    if (!response.includes('Login Succeeded')) {
      throw new Error('Failed to log in to Docker registry');
    }
  }

  async logout(server: string) {
    await this.$`docker logout ${server}`;
  }

  async pull(image: string) {
    await this.$`docker pull ${image}`;
  }
}
