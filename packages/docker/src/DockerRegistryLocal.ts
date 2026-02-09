import $, { NodevisorProxy } from '@nodevisor/shell';
import Registry, { type RegistryConfig } from '@nodevisor/registry';

export type DockerRegistryLocalConfig = RegistryConfig & {};

export default class DockerRegistryLocal extends Registry {
  constructor(config: DockerRegistryLocalConfig) {
    super(config);
  }

  async getLoginCredentials() {
    return {
      password: 'n/a',
      username: 'n/a',
      server: 'n/a',
    };
  }

  async login(_$con: NodevisorProxy) {
    console.log('login');
  }

  // todo add support for multiple tags
  async push(image: string, options: { tags?: string[] } = {}, $con = $) {
    throw new Error('Not implemented');
  }
}
