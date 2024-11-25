import fs from 'node:fs/promises';
import Registry from '@nodevisor/registry';
import DockerBuilder, { type DockerBuilderConfig } from './DockerBuilder';
import { Dockerfile } from '../dockerfiles';

export type DockerfileBuilderConfig = DockerBuilderConfig & {
  dockerfile?: Dockerfile;
};

export default class DockerfileBuilder extends DockerBuilder {
  readonly dockerfile: Dockerfile;

  constructor(config: DockerfileBuilderConfig = {}) {
    const { dockerfile = new Dockerfile(), ...rest } = config;

    super(rest);

    this.dockerfile = dockerfile;
  }

  async build(image: string, registry: Registry, options: { push?: boolean; context?: string }) {
    const { dockerfilePath } = this;

    const dockerfileContent = await this.getDockerfileContent();

    // save Dockerfile to file
    await fs.writeFile(dockerfilePath, dockerfileContent);

    try {
      return await super.build(image, registry, options);
    } finally {
      // remove the Dockerfile
      await fs.unlink(dockerfilePath);
    }
  }

  async getDockerfileContent() {
    return this.dockerfile.toString();
  }
}
