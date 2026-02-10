import { unset } from 'lodash';
import { CommandBuilder, ShellConnection, raw } from '@nodevisor/shell';
import Builder from '@nodevisor/builder';
import Registry from '@nodevisor/registry';
import type Labels from './@types/Labels';
import type Environment from './@types/Environment';
import type PortObject from './@types/PortObject';
import type Port from './@types/Port';
import portToPortObject from './utils/portToPortObject';
import ClusterBase from './ClusterBase';
import ClusterServiceBase, { type ClusterServiceBaseConfig } from './ClusterServiceBase';
import type Dependency from './@types/Dependency';
import type PartialFor from './@types/PartialFor';
import uniqDependencies from './utils/uniqDependencies';
import ClusterContext from './ClusterContext';
import type Volume from './@types/Volume';
import type ClusterType from './constants/ClusterType';
import type Restart from './@types/Restart';
import type Placement from './@types/Placement';
import Mode from './constants/Mode';
import type Sysctls from './@types/Sysctls';
import type Capabilities from './@types/Capabilities';

export type ClusterServiceConfig = ClusterServiceBaseConfig & {
  image?: string; // Format: 'name:tag' (e.g. 'myapp:1.0.0')
  context?: string;
  registry?: Registry;
  builder?: Builder;
  mode?: Mode;
  placement?: Placement;
  dependencies?: Array<ClusterService | PartialFor<Dependency, 'cluster'>>;
  labels?: Labels;
  sysctls?: Sysctls;
  capabilities?: Capabilities;
  profiles?: string[];
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
    min?: number; // default 0
    max?: number; // default Infinity
    initial?: number; // initial number of replicas to run
  };
  ports?: PortObject[];
  command?: string;
  restart?: Restart;
};

export default abstract class ClusterService extends ClusterServiceBase {
  readonly image?: string;
  readonly context?: string;
  readonly registry?: Registry;
  readonly builder?: Builder;
  private mode: Mode;
  private placement?: Placement;

  private dependencies: PartialFor<Dependency, 'cluster'>[] = [];
  private labels: Labels;
  private sysctls: Sysctls;
  private capabilities: Capabilities;
  private profiles: string[];
  private environment: Environment;
  private restart?: Restart;
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
    initial?: number; // initial number of replicas to run
  };
  private ports: PortObject[];
  private command = new CommandBuilder(new ShellConnection()).setShellQuote();

  constructor(config: ClusterServiceConfig) {
    const {
      image,
      context,
      registry,
      builder,
      labels = {},
      sysctls = {},
      capabilities = {},
      environment = {},
      profiles = [],
      cpus = {},
      memory = {},
      replicas = {},
      ports = [],
      dependencies = [],
      restart,
      command,
      mode = Mode.REPLICATED,
      placement,
      ...baseConfig
    } = config;

    super(baseConfig);

    this.image = image;
    this.context = context;
    this.registry = registry;
    this.builder = builder;
    this.mode = mode;
    this.placement = placement;
    this.labels = labels;
    this.sysctls = sysctls;
    this.capabilities = capabilities;
    this.profiles = profiles;
    this.environment = environment;
    this.cpus = cpus;
    this.memory = memory;
    this.replicas = replicas;
    this.ports = ports;
    this.restart = restart;

    if (command) {
      this.command.append`${raw(command)}`;
    }

    dependencies.forEach((dependency) => this.addDependency(dependency));
  }

  addDependency(input: ClusterService | PartialFor<Dependency, 'cluster'>) {
    const dependency =
      input instanceof ClusterService
        ? {
            service: input,
          }
        : {
            ...input,
          };

    // todo add uniq
    this.dependencies = [...this.dependencies, dependency];
    return this;
  }

  isExternal(cluster: ClusterBase, dependency: Dependency) {
    return dependency.cluster && dependency.cluster.name !== cluster.name;
  }

  getDependencies(cluster: ClusterBase, includeExternal = false, includeDepends = false) {
    const dependencies: Dependency[] = [];

    if (!cluster) {
      throw new Error('Cluster is required to get dependencies');
    }

    this.dependencies.forEach((dep) => {
      const dependency = {
        cluster,
        ...dep,
      };

      const isDependencyExternal = this.isExternal(cluster, dependency);

      const process = includeExternal ? true : !isDependencyExternal;
      if (!process) {
        return;
      }

      dependencies.push(dependency);

      // only include depends if the dependency is not external, external dependencies have dependencies processed in different cluster
      if (includeDepends && !isDependencyExternal) {
        const dependServices = dependency.service.getDependencies(
          dependency.cluster,
          includeExternal,
          includeDepends,
        );

        dependServices.forEach((dependService) => {
          dependencies.push(dependService);
        });
      }
    });

    return uniqDependencies(dependencies);
  }

  getMode() {
    return this.mode;
  }

  getPlacement() {
    return this.placement;
  }

  getRestart() {
    return this.restart;
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

    const { min = 0.25, max = 1 } = cpus ?? {};

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

    const { min = 0, max = Infinity, initial } = replicas ?? {};
    if (min > max) {
      throw new Error('min cannot be greater than max');
    }

    const definedInitial = initial ?? 1;
    if (min > definedInitial) {
      throw new Error('initial cannot be less than min');
    }

    if (definedInitial > max) {
      throw new Error('initial cannot be greater than max');
    }

    return { min, max, initial: definedInitial };
  }

  getLabels() {
    return {
      ...this.labels,
    };
  }

  getSysctls() {
    return {
      ...this.sysctls,
    };
  }

  getCapabilities() {
    const { add = [], drop = [] } = this.capabilities;

    return {
      add,
      drop,
    };
  }

  addCapability(value: string) {
    const { add = [] } = this.capabilities;
    this.capabilities.add = [...add, value];
    return this;
  }

  dropCapability(value: string) {
    const { drop = [] } = this.capabilities;
    this.capabilities.drop = [...drop, value];
    return this;
  }

  setSysctl(key: string, value: string | number | boolean | undefined) {
    if (value === undefined) {
      unset(this.sysctls, key);
    } else {
      this.sysctls[key] = value;
    }

    return this;
  }

  getSysctl(key: string) {
    const sysctls = this.getSysctls();
    return sysctls[key];
  }

  hasSysctls() {
    const sysctls = this.getSysctls();
    return !!Object.keys(sysctls).length;
  }

  getProfiles() {
    return this.profiles;
  }

  hasProfiles() {
    const profiles = this.getProfiles();
    return !!profiles.length;
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
    if ('initial' in replicas) {
      this.replicas.initial = replicas.initial;
    }

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
    const labels = this.getLabels();
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
    const environments = this.getEnvironments();
    return environments[key];
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

  /*
  toJSON() {
    return {
      name: this.name,
      image: this.image,
      environment: {
        ...this.environment,
      },
      labels: {
        ...this.labels,
      },
      ports: this.ports.map((port) => ({ ...port })),
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
  }
  */

  toObject() {
    const data: ClusterServiceConfig = {
      name: this.name,
      image: this.image,
      environment: this.getEnvironments(),
      labels: this.getLabels(),
      profiles: this.getProfiles(),
      ports: this.getPorts(),
      restart: this.getRestart(),
      mode: this.getMode(),
      placement: this.getPlacement(),
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

  getNetworkName(cluster: ClusterBase) {
    return cluster.getNetworkName(this);
  }

  getVolumeName(cluster: ClusterBase, volume: Volume) {
    return cluster.getVolumeName(this, volume);
  }

  run<TReturn>(cluster: ClusterBase, type: ClusterType, fn: () => TReturn) {
    return ClusterContext.run(
      {
        cluster,
        type,
      },
      fn,
    );
  }

  async build(
    options: { registry?: Registry; context?: string; push?: boolean; labels?: Labels } = {},
  ) {
    const { labels = {}, ...restOptions } = options;
    const { builder } = this;
    if (!builder) {
      return;
    }

    // service registry has higher priority over options.registry
    const registry = this.registry ?? options.registry;
    if (!registry) {
      throw new Error(`Registry is required to build service ${this.name}`);
    }

    // service context has higher priority over options.context
    const context = this.context ?? options.context;
    if (!context) {
      throw new Error(`Context is required to build service ${this.name}`);
    }

    const image = this.image ?? this.name;

    await builder.build(image, registry, {
      ...restOptions,
      context,
      labels: {
        service: this.name,
        ...labels,
      },
    });
  }
}
