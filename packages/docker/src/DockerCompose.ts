import { Module } from '@nodevisor/core';
import Docker from './Docker';

type DockerComposeOptions = {
  ansi?: 'never' | 'always' | 'auto'; // default: auto
  file?: string | string[];
  envFile?: string;
  projectName?: string;
  progress?: 'auto' | 'tty' | 'plain' | 'json' | 'quiet'; // default: auto
  parallel?: number;
};

export default class DockerCompose extends Module {
  readonly docker = new Docker(this.nodevisor);

  // https://docs.docker.com/reference/cli/docker/compose/
  private composeCommandBuilder(options: DockerComposeOptions = {}) {
    const { ansi, file, envFile, projectName, progress, parallel } = options;

    return this.$`docker compose`.argument({
      '--ansi': ansi,
      '--file': file,
      '--env-file': envFile,
      '--project-name': projectName,
      '--progress': progress,
      '--parallel': parallel,
    });
  }

  private composeCommand(command: string, options: DockerComposeOptions = {}) {
    return this.composeCommandBuilder(options).argument(command, null);
  }

  // https://docs.docker.com/reference/cli/docker/compose/
  async compose(options: DockerComposeOptions = {}) {
    return this.composeCommandBuilder(options).text();
  }

  async up(
    options: DockerComposeOptions & {
      detach?: boolean;
      wait?: boolean;
      waitTimeout?: number;
      forceRecreate?: boolean;
    } = {},
  ) {
    const { detach = true, wait = true, waitTimeout, forceRecreate, ...composeOptions } = options;

    return this.composeCommand('up', composeOptions)
      .argument({
        '--detach': detach,
        '--wait': wait,
        '--wait-timeout': waitTimeout,
        '--force-recreate': forceRecreate,
      })
      .text();
  }

  // https://docs.docker.com/reference/cli/docker/compose/run/
  async run(
    service: string,
    options: {
      rm?: boolean;
      pull?: 'always' | 'missing' | 'never';
      detach?: boolean;
      profile?: string[];
    },
  ) {
    const { rm = true, pull = 'always', detach = true, profile } = options;

    const cb = this.composeCommand('run')
      .argument({
        '--rm': rm,
        '--pull': pull,
        '--profile': profile,
      })
      .argument(service, null)
      .text();
  }
}
