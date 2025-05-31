import fs from 'node:fs/promises';
import Registry from '@nodevisor/registry';
import DockerBuilder, { type DockerBuilderConfig } from './DockerBuilder';
import { Dockerfile } from '../dockerfiles';

export type DockerfileBuilderConfig = DockerBuilderConfig & {};

export default class DockerfileBuilder extends DockerBuilder {
  constructor(config: DockerfileBuilderConfig = {}) {
    super(config);
  }

  async build(
    image: string,
    registry: Registry,
    options: { push?: boolean; load?: boolean; context?: string },
  ) {
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

  protected prepareDockerfile() {
    return new Dockerfile();
  }

  get dockerfile(): Dockerfile {
    return this.prepareDockerfile();
  }

  getStage(name: string) {
    return this.dockerfile.getStage(name);
  }

  async getDockerfileContent() {
    return this.dockerfile.toString();
  }
}
