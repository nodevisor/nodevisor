import $, { NodevisorProxy } from '@nodevisor/shell';
import Registry, { type RegistryConfig } from '@nodevisor/registry';
import Docker from './Docker';

export type DockerRegistryConfig = RegistryConfig & {
  username?: string; // Optional username for login
  password?: string; // Optional password for login
  server?: string; // Docker registry URL, e.g., 'registry.example.com'
};

export default class DockerRegistry extends Registry {
  private server: string;
  private username?: string;
  private password?: string;

  constructor(config: DockerRegistryConfig) {
    const { server = 'docker.io', username, password } = config;

    super(config);

    this.server = server;
    this.username = username;
    this.password = password;
  }

  async getLoginCredentials() {
    const { username, password, server } = this;

    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    return {
      password,
      username,
      server,
    };
  }

  async login($con: NodevisorProxy) {
    const docker = $con(Docker);

    const credentials = await this.getLoginCredentials();
    await docker.login(credentials);
  }

  // todo add support for multiple tags
  async push(image: string, options: { tags?: string[] } = {}, $con = $) {
    const { tags = [] } = options;

    await this.login($);

    const imageWithoutTag = Registry.getImage(image);

    const currentTags = [...tags];

    const tag = Registry.getTag(image);
    if (tag) {
      currentTags.push(tag);
    }

    const docker = $con(Docker);

    await Promise.all(currentTags.map((tag) => docker.tag(imageWithoutTag, tag)));

    throw new Error('Not implemented');
    /*
    currentTags.forEach(async (tag) => {
      docker.push(tag);
    });
    */
  }
}
