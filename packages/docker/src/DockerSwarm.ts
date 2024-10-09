import { Service } from '@nodevisor/core';
import Docker from './Docker';

export default class DockerSwarm extends Service {
  readonly name = 'docker-swarm';
  readonly docker = new Docker(this.nodevisor);

  // package

  // package version methods
  async getVersion() {
    return this.docker.getVersion();
  }

  async isInstalled() {
    return this.docker.isInstalled();
  }

  async installPackage() {
    return this.docker.installPackage();
  }

  async uninstallPackage() {
    return this.docker.uninstallPackage();
  }

  // service
  async isRunning() {
    if (!(await this.docker.isRunning())) {
      return false;
    }

    const response = await this.$`docker info`.text();
    return response?.includes('Swarm: active');
  }

  async start() {
    if (!(await this.isInstalled())) {
      throw new Error('Docker is not installed');
    }

    if (await this.isRunning()) {
      return;
    }

    await this.$`docker swarm init`;

    if (!(await this.isRunning())) {
      throw new Error('Failed to start docker swarm');
    }
  }

  async stop() {
    if (!(await this.isRunning())) {
      return;
    }

    await this.$`docker swarm leave --force`;

    if (await this.isRunning()) {
      throw new Error('Failed to stop docker swarm');
    }
  }

  async deploy(stack: string, composeFile: string) {
    return this.$`docker stack deploy -c ${composeFile} ${stack}`;
  }
}
