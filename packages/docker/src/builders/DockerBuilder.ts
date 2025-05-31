import fs from 'node:fs/promises';
import path from 'node:path';
import $ from '@nodevisor/core';
import Docker from '../Docker';
import type TargetPlatform from '../@types/TargetPlatform';
import Builder, { type BuilderConfig } from '@nodevisor/builder';
import Registry from '@nodevisor/registry';
import { log as baseLog } from '@nodevisor/core';

const log = baseLog.extend('DockerBuilder');

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

  constructor(config: DockerBuilderConfig = {}) {
    const { dockerfilePath = 'Dockerfile', ...rest } = config;

    super(rest);

    this.dockerfilePath = dockerfilePath;
  }

  // todo add target
  async build(
    image: string,
    registry: Registry,
    options: {
      push?: boolean;
      load?: boolean;
      context?: string;
      labels?: Record<string, string>;
    },
    $con = $,
  ) {
    const { push = true, load = false, context = this.context, labels } = options;

    const { arch, args, tags, dockerfilePath } = this;

    if (push && !tags.length) {
      throw new Error('Tags are required to push the image');
    }

    const contextResolved = path.resolve(context);
    log('context', contextResolved);

    // login to the registry
    await registry.login($con);

    // tags are here format 'image:tag' and 'repository:tag'
    const imageTags = tags.map((tag) => Registry.getImageWithTag(image, tag));
    log('imageTags', imageTags);

    await $con(Docker).buildx(dockerfilePath, {
      context: contextResolved,
      tags: imageTags,
      args,
      platform: getPlatform(arch),
      push,
      load,
      labels,
    });

    return imageTags;
  }

  async login() {}

  async getDockerfileContent() {
    const { dockerfilePath } = this;

    return await fs.readFile(dockerfilePath, 'utf8');
  }
}
