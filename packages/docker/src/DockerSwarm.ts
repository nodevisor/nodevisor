import { Module } from '@nodevisor/shell';
import Docker from './Docker';

export default class DockerSwarm extends Module {
  readonly name = 'docker-swarm';
  readonly docker = new Docker(this.nodevisor);

  async isActive() {
    if (!(await this.docker.isRunning())) {
      return false;
    }

    const response = await this.$`docker info`.text();
    return response?.includes('Swarm: active');
  }

  async init(address?: string) {
    if (await this.isActive()) {
      return;
    }

    await this.$`docker swarm init`.argument('--advertise-addr', address);

    if (!(await this.isActive())) {
      throw new Error('Failed to start docker swarm');
    }
  }

  async leave() {
    if (!(await this.isActive())) {
      return;
    }

    await this.$`docker swarm leave --force`;

    if (await this.isActive()) {
      throw new Error('Failed to stop docker swarm');
    }
  }

  async getManagerToken() {
    return this.$`docker swarm join-token -q manager`.text();
  }

  async getWorkerToken() {
    return this.$`docker swarm join-token -q worker`.text();
  }

  async join(token: string, address: string, port = 2377) {
    return this.$`docker swarm join`.argument('--token', token).append` ${address}:${port}`.text();
  }

  async promote(node: string) {
    return this.$`docker node promote ${node}`;
  }

  async demote(node: string) {
    return this.$`docker node demote ${node}`;
  }
}
