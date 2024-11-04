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
      forceRecreate?: boolean;
    } = {},
  ) {
    const { detach, forceRecreate, ...composeOptions } = options;

    return this.composeCommand('up', composeOptions)
      .argument({
        '--detach': detach,
        '--force-recreate': forceRecreate,
      })
      .text();
  }
}
