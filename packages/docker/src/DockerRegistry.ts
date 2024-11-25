import $, { NodevisorProxy } from '@nodevisor/core';
import Registry, { type RegistryConfig } from '@nodevisor/registry';
import Docker from './Docker';

export type DockerRegistryConfig = RegistryConfig & {
  username?: string; // Optional username for login
  password?: string; // Optional password for login
  url?: string; // Docker registry URL, e.g., 'registry.example.com'
};

export default class DockerRegistry extends Registry {
  private url: string;
  private username?: string;
  private password?: string;

  constructor(config: DockerRegistryConfig) {
    const { url = 'docker.io', username, password } = config;

    super(config);

    this.url = url;
    this.username = username;
    this.password = password;
  }

  // 123456789.dkr.ecr.eu-central-1.amazonaws.com/project-web
  getURI(image: string, options: { tag?: string } = {}) {
    const { tag } = options;
    const uri = `${this.url}/${image}`;

    return tag ? `${uri}:${tag}` : uri;
  }

  async getLoginCredentials() {
    const { username, password, url } = this;

    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    return {
      password,
      username,
      server: url,
    };
  }

  async login($con: NodevisorProxy) {
    const docker = $con(Docker);

    const credentials = await this.getLoginCredentials();
    await docker.login(credentials);
  }

  async push(image: string, tag: string = 'latest', $con = $) {
    await this.login($);

    const imageTag = this.getURI(image, { tag });

    const docker = $con(Docker);
    await docker.tag(image, imageTag);
    await docker.push(imageTag);
  }
}
