import { Module } from '@nodevisor/core';
import Docker from './Docker';

export default class DockerStack extends Module {
  readonly docker = new Docker(this.nodevisor);

  // https://docs.docker.com/reference/cli/docker/stack/
  private command(command: string) {
    return this.$`docker stack`.argument(command, null);
  }

  // https://docs.docker.com/reference/cli/docker/stack/deploy/
  async deploy(
    stackName: string,
    options: {
      composeFile?: string;
      detach?: boolean; // default: true
      prune?: boolean;
      quiet?: boolean;
      resolveImage?: 'always' | 'never' | 'changed'; // default: always
      withRegistryAuth?: boolean;
    },
  ) {
    const {
      composeFile = 'docker-compose.yml',
      detach,
      prune,
      quiet,
      resolveImage,
      withRegistryAuth,
    } = options;

    if (!stackName) {
      throw new Error('stackName is required');
    }

    return this.command('up')
      .argument({
        '--compose-file': composeFile,
        '--detach': detach,
        '--prune': prune,
        '--quiet': quiet,
        '--resolve-image': resolveImage,
        '--with-registry-auth': withRegistryAuth,
      })
      .argument(stackName, null)
      .text();
  }

  async ls(options: { format?: 'table' | 'json' | string } = {}) {
    const { format } = options;

    const cb = this.command('ls').argument({
      '--format': format,
    });

    if (format === 'json') {
      return cb.json();
    }

    return cb.text();
  }

  async services(stack: string) {
    return this.$`docker stack services ${stack}`;
  }
}
