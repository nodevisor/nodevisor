import { Service } from '@nodevisor/core';
import Docker from './Docker';

export default class DockerSwarm extends Service {
  readonly name = 'docker-swarm';
  readonly docker = this.module(Docker);

  // package

  // package version methods
  async getVersion() {
    return this.docker.getVersion();
  }

  async isInstalled() {
    return this.docker.isInstalled();
  }

  async update() {
    await this.docker.update();
    return this;
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

    const response = await this.$`docker info`;
    return response?.includes('Swarm: active');
  }

  async start() {
    if (!(await this.isInstalled())) {
      throw new Error('Docker is not installed');
    }

    if (await this.isRunning()) {
      return this;
    }

    await this.$`docker swarm init`;

    if (!(await this.isRunning())) {
      throw new Error('Failed to start docker swarm');
    }

    return this;
  }

  async stop() {
    if (!(await this.isRunning())) {
      return this;
    }

    await this.$`docker swarm leave --force`;

    if (await this.isRunning()) {
      throw new Error('Failed to stop docker swarm');
    }

    return this;
  }
}
