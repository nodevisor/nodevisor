import fs from 'node:fs/promises';
import Docker from '../Docker';
import type TargetPlatform from '../@types/TargetPlatform';
import Builder, { type BuilderConfig } from '@nodevisor/builder';
import Registry from '@nodevisor/registry';

function getPlatform(
  arch?: 'amd64' | 'arm64' | ['amd64', 'arm64'],
): TargetPlatform | TargetPlatform[] | undefined {
  if (!arch) {
    return undefined;
  }

  if (Array.isArray(arch)) {
    return arch.map((arch) => getPlatform(arch)) as TargetPlatform[];
  }

  if (arch === 'amd64') {
    return 'linux/amd64';
  }

  return 'linux/arm64';
}

export type DockerBuilderConfig = BuilderConfig & {
  dockerfilePath?: string; // path to the Dockerfile, defaults to Dockerfile
};

export default class DockerBuilder extends Builder {
  protected dockerfilePath: string;
  protected docker = new Docker();

  constructor(config: DockerBuilderConfig = {}) {
    const { dockerfilePath = 'Dockerfile', ...rest } = config;

    super(rest);

    this.dockerfilePath = dockerfilePath;
  }

  // todo add target
  async build(registry: Registry, push = false) {
    const { arch, context, args, tags, dockerfilePath } = this;

    // login to the registry
    const credentials = await registry.getLoginCredentials();
    await this.docker.login(credentials);

    const imageTags = tags.map((tag) => registry.getURI({ tag }));

    const result = await this.docker.buildx(dockerfilePath, {
      context,
      tags: imageTags,
      args,
      platform: getPlatform(arch),
      push,
    });

    console.log('docker build result', result);

    // return result;
  }

  async login() {}

  async getDockerfileContent() {
    const { dockerfilePath } = this;

    return await fs.readFile(dockerfilePath, 'utf8');
  }
}
