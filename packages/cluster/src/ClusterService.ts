import { CommandBuilder, ShellConnection, raw } from '@nodevisor/core';
import type Port from './@types/Port';
import type Volume from './@types/Volume';
import type Registry from './@types/Registry';
import type DockerContainer from './@types/DockerContainer';
import type Labels from './@types/Labels';
import toDockerPorts from './utils/toDockerPorts';
import toDockerLabels from './utils/toDockerLabels';

type CommandArgs = Record<string, string | boolean | number>;

export type ClusterServiceConfig = {
  name: string;
  image: string;
  tags?: string[];
  // https://docs.docker.com/engine/network/
  ports?: Port[];

  // volumes to be mounted to the service
  volumes?: Record<string, string>;
  environment?: Record<string, string>;
  labels?: Labels;

  command?: string;
  commandArgs?: CommandArgs;

  restart?: 'always' | 'unless-stopped' | 'no';
  networks?: string[];

  registry?: Registry;

  cpus?: {
    min?: string; // default 1, e.g., '0.5' (50% of a CPU)
    max?: string; // default 1
  };
  memory?: {
    // https://docs.docker.com/reference/compose-file/extension/#specifying-byte-values
    min?: string; // default 128mb, e.g.: 256mb, 2b, 1024kb, 2048k, 300m, 1gb
    max?: string; // default 512mb
  };
  // scale for auto-scaling based on CPU and memory usage
  scale?: {
    min?: number; // default 1
    max?: number; // default 1
  };
};

export default class ClusterService {
  config: ClusterServiceConfig;
  commandArgs: CommandArgs;

  constructor(config: ClusterServiceConfig) {
    const { commandArgs = {}, ...rest } = config;

    this.config = config;
    this.commandArgs = commandArgs;
  }

  get name() {
    return this.config.name;
  }

  getDockerCommandBuilder() {
    const { command, commandArgs } = this.config;

    const cb = new CommandBuilder(new ShellConnection()).setShellQuote();
    if (command) {
      cb.append`${raw(command)}`;
    }

    if (commandArgs) {
      cb.argument(commandArgs);
    }

    return cb;
  }

  getDockerLabels() {
    return toDockerLabels(this.config.labels);
  }

  getDockerPorts() {
    return toDockerPorts(this.config.ports);
  }

  getDockerConfig() {
    const {
      image,
      volumes,
      environment,
      networks,
      restart,
      cpus = {},
      memory = {},
      scale = {},
    } = this.config;

    const { min: cpuMin = '0.5', max: cpuMax = '1' } = cpus;
    const { min: memoryMin = '128mb', max: memoryMax = '512mb' } = memory;

    const commandBuilder = this.getDockerCommandBuilder();

    const resources = {
      limits: {
        cpus: cpuMax,
        memory: memoryMax,
      },
      reservations: {
        cpus: cpuMin,
        memory: memoryMin,
      },
    };

    const config: DockerContainer = {
      image,
      command: commandBuilder.toString(),
      restart,
      volumes,
      environment,
      networks,
      labels: this.getDockerLabels(),
      ports: this.getDockerPorts(),
      deploy: {
        resources,
      },
    };

    return config;
  }

  getDockerVolumes() {
    const { volumes = {} } = this.getDockerConfig();

    /*
    volumes:
      redis-data:
        driver: local
    */

    const volumesConfig: Record<string, Volume> = {};

    Object.entries(volumes).forEach(([name]) => {
      volumesConfig[name] = { driver: 'local' };
    });

    return volumesConfig;
  }
}
