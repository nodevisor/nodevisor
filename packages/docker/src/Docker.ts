import { Service } from '@nodevisor/shell';
import Groups from '@nodevisor/groups';
import Packages, { PackageManager } from '@nodevisor/packages';
import Services from '@nodevisor/services';
import FS from '@nodevisor/fs';
import type TargetPlatform from './@types/TargetPlatform';

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
  // user need to relogin to apply changes
  async allowUser(username: string, skipRestart = false) {
    // https://docs.docker.com/engine/install/linux-postinstall/
    // add group docker if it does not exist
    await this.groups.add('docker');

    // add user to docker group
    await this.groups.addUser(username, 'docker');
  }

  async login(options: { username: string; password: string; server: string }): Promise<void> {
    const { username, password, server } = options;

    try {
      const response = await this.$`docker login --username ${username} --password-stdin ${server}`
        .stdin(password)
        .text();

      if (!response.includes('Login Succeeded')) {
        throw new Error('Failed to log in to Docker registry');
      }
    } catch (error) {
      // on mac you need to use "credsStore": "osxkeychain"
      if (error instanceof Error && error.message.includes('not implemented')) {
        throw new Error(`Login failed. Check your docker config.json. ${error.message}`);
      }

      throw error;
    }
  }

  async logout(server: string) {
    await this.$`docker logout ${server}`;
  }

  // list all images in the local (system) registry
  async images() {
    return await this.$`docker images`.text();
  }

  async pull(image: string) {
    return await this.$`docker pull ${image}`.text();
  }

  async tag(image: string, tag: string) {
    return await this.$`docker image tag ${image} ${tag}`.text();
  }

  async push(tag: string) {
    return await this.$`docker image push ${tag}`.text();
  }

  async ls() {
    return await this.$`docker image ls`.text();
  }

  // https://docs.docker.com/reference/cli/docker/buildx/build/
  async buildx(
    dockerfilePath: string,
    options: {
      platform?: TargetPlatform | TargetPlatform[]; // platform to build for
      args?: Record<string, string | number | boolean | undefined | null>; // additional build arguments
      tags?: string[]; // image tags
      context?: string; // build context, which is the directory Docker will use for the build
      push?: boolean; // push the built image to the registry
      load?: boolean; // push the built image to the local docker daemon
      target?: string;
      labels?: Record<string, string>;
    } = {},
  ) {
    const {
      platform,
      args = {},
      tags = [],
      context = '.',
      push = false,
      load = false,
      labels = {},
    } = options;

    const cb = this.$`docker buildx build`.argument({
      '-f': dockerfilePath,
      '-t': tags,
      '--build-arg': args,
      '--push': push ? null : undefined,
      '--load': load ? null : undefined,
      '--platform': Array.isArray(platform) ? platform.join(',') : platform,
      '--label': labels,
    });

    // context is the last argument
    if (context) {
      cb.argument(context, null);
    }

    return cb.text();
  }
}
