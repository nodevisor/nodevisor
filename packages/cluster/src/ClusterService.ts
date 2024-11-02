import { unset } from 'lodash';
import { CommandBuilder, ShellConnection, raw } from '@nodevisor/core';
import Builder from '@nodevisor/builder';
import Registry from '@nodevisor/registry';
import type Labels from './@types/Labels';
import type Environment from './@types/Environment';
import type PortObject from './@types/PortObject';
import type Port from './@types/Port';
import portToPortObject from './utils/portToPortObject';

export type ClusterServiceConfig = {
  name: string;
  image?: string;
  registry?: Registry;
  builder?: Builder;
  labels?: Labels;
  environment?: Environment;
  cpus?: {
    min?: string | number; // default 1, e.g., '0.5' (50% of a CPU)
    max?: string | number; // default 1
  };
  memory?: {
    // https://docs.docker.com/reference/compose-file/extension/#specifying-byte-values
    min?: string | number; // default 128mb, e.g.: 256mb, 2b, 1024kb, 2048k, 300m, 1gb
    max?: string | number; // default 512mb
  };
  // replicas for auto-scaling based on CPU and memory usage
  replicas?: {
    min?: number; // default 1
    max?: number; // default 1
  };
  ports?: PortObject[];
  command?: string;
};

export default class ClusterService {
  readonly name: string;
  readonly image?: string;
  readonly registry?: Registry;
  readonly builder?: Builder;

  protected clusterName?: string;

  private labels: Labels;
  private environment: Environment;
  private cpus: {
    min?: string | number; // default 1, e.g., '0.5' (50% of a CPU)
    max?: string | number; // default 1
  };
  private memory: {
    // https://docs.docker.com/reference/compose-file/extension/#specifying-byte-values
    min?: string | number; // default 128mb, e.g.: 256mb, 2b, 1024kb, 2048k, 300m, 1gb
    max?: string | number; // default 512mb
  };
  // replicas for auto-scaling based on CPU and memory usage
  private replicas: {
    min?: number; // default 1
    max?: number; // default 1
  };
  private ports: PortObject[];
  private command = new CommandBuilder(new ShellConnection()).setShellQuote();

  constructor(config: ClusterServiceConfig) {
    const {
      name,
      image,
      registry,
      builder,
      labels = {},
      environment = {},
      cpus = {},
      memory = {},
      replicas = {},
      ports = [],
      command,
    } = config;

    this.name = name;
    this.image = image;
    this.registry = registry;
    this.builder = builder;
    this.labels = labels;
    this.environment = environment;
    this.cpus = cpus;
    this.memory = memory;
    this.replicas = replicas;
    this.ports = ports;

    if (command) {
      this.command.append`${raw(command)}`;
    }
  }

  setClusterName(clusterName: string | undefined) {
    this.clusterName = clusterName;
    return this;
  }

  getPorts() {
    return this.ports.map((port) => ({ ...port }));
  }

  hasPorts() {
    // ports can be filled during getPorts
    const ports = this.getPorts();
    return !!ports.length;
  }

  getCpus() {
    const { cpus } = this;

    const { min = 0.5, max = 1 } = cpus ?? {};

    return { min, max };
  }

  getMemory() {
    const { memory } = this;

    const { min = 128, max = 512 } = memory ?? {};

    const minFormatted = typeof min === 'number' ? `${min}mb` : min;
    const maxFormatted = typeof max === 'number' ? `${max}mb` : max;

    return { min: minFormatted, max: maxFormatted };
  }

  getReplicas() {
    const { replicas } = this;

    const { min = 1, max = 1 } = replicas ?? {};

    return { min, max };
  }

  getLabels() {
    return {
      ...this.labels,
    };
  }

  hasLabels() {
    const labels = this.getLabels();
    return !!Object.keys(labels).length;
  }

  getEnvironments() {
    return {
      ...this.environment,
    };
  }

  hasEnvironments() {
    // environments can be filled during getEnvironments
    const environments = this.getEnvironments();
    return !!Object.keys(environments).length;
  }

  setCpus(cpus: ClusterServiceConfig['cpus'] = {}) {
    if ('min' in cpus) {
      this.cpus.min = cpus.min;
    }

    if ('max' in cpus) {
      this.cpus.max = cpus.max;
    }

    return this;
  }

  setMemory(memory: ClusterServiceConfig['memory'] = {}) {
    if ('min' in memory) {
      this.memory.min = memory.min;
    }

    if ('max' in memory) {
      this.memory.max = memory.max;
    }

    return this;
  }

  setReplicas(replicas: ClusterServiceConfig['replicas'] = {}) {
    if ('min' in replicas) {
      this.replicas.min = replicas.min;
    }

    if ('max' in replicas) {
      this.replicas.max = replicas.max;
    }

    return this;
  }

  addPort(port: Port) {
    const { ports } = this;

    const portObject = portToPortObject(port);

    // throw error if port is already added
    const exists = ports.some((p) => {
      const pProtocol = p.protocol ?? 'tcp';
      const parsedProtocol = portObject.protocol ?? 'tcp';

      return (
        p.target === portObject.target &&
        p.published === portObject.published &&
        pProtocol === parsedProtocol
      );
    });

    if (exists) {
      throw new Error('Port already added');
    }

    ports.push(portObject);

    return this;
  }

  setLabel(key: string, value: string | number | boolean | undefined) {
    if (value === undefined) {
      unset(this.labels, key);
    } else {
      this.labels[key] = value;
    }

    return this;
  }

  getLabel(key: string) {
    const { labels } = this;
    return labels[key];
  }

  setEnvironment(key: string, value: string | number | boolean | undefined) {
    if (value === undefined) {
      unset(this.environment, key);
    } else {
      this.environment[key] = value;
    }

    return this;
  }

  getEnvironment(key: string) {
    const { environment } = this;
    return environment[key];
  }

  addCommandArgument(key: string, value: string | number | boolean | undefined) {
    this.command.argument(key, value);
    return this;
  }

  getCommand() {
    return this.command.clone();
  }

  hasCommand() {
    // command can be filled during getCommand
    const command = this.getCommand();
    return !command.isEmpty();
  }

  toObject() {
    const data: ClusterServiceConfig = {
      name: this.name,
      image: this.image,
      environment: this.getEnvironments(),
      labels: this.getLabels(),
      ports: this.getPorts(),
      cpus: {
        ...this.cpus,
      },
      memory: {
        ...this.memory,
      },
      replicas: {
        ...this.replicas,
      },
    };

    if (this.hasCommand()) {
      data.command = this.getCommand().toString();
    }

    return data;
  }

  clone() {
    return new ClusterService(this.toObject());
  }

  getNetworkName() {
    const { clusterName } = this;
    if (!clusterName) {
      throw new Error(
        'You must set cluster name before getting network name. Did you forget to assign service to cluster?',
      );
    }

    return `${clusterName}_${this.name}_network`;
  }
}
