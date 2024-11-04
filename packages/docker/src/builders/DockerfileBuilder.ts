import fs from 'node:fs/promises';
import Registry from '@nodevisor/registry';
import DockerBuilder, { type DockerBuilderConfig } from './DockerBuilder';
import { Dockerfile, DockerfileStage } from '../dockerfiles';

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

  async build(registry: Registry, push = false) {
    const { dockerfilePath } = this;

    const dockerfileContent = await this.getDockerfileContent();

    // save to file
    await fs.writeFile(dockerfilePath, dockerfileContent);

    return super.build(registry, push);
  }

  async getDockerfileContent() {
    return this.dockerfile.toString();
  }
}
