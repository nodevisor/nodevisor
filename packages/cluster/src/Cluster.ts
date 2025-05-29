import { User, UserConfig } from '@nodevisor/core';
import { uniq } from 'lodash';
import Registry from '@nodevisor/registry';
import ClusterService from './ClusterService';
import ClusterNode, { type ClusterNodeConfig } from './ClusterNode';
import ClusterBase, { type ClusterBaseConfig } from './ClusterBase';
import Dependency from './@types/Dependency';
import type PartialFor from './@types/PartialFor';
import uniqDependencies from './utils/uniqDependencies';

export type ClusterConfig<
  TClusterService extends ClusterService,
  TClusterNode extends ClusterNode,
> = ClusterBaseConfig & {
  users?: Array<User | UserConfig>;
  nodes?: Array<TClusterNode | string>;
  dependencies?: Array<TClusterService | PartialFor<Dependency, 'cluster'>>;
  context?: string;
  registry?: Registry;
};

export default abstract class Cluster<
  TClusterService extends ClusterService,
  TClusterNode extends ClusterNode,
> extends ClusterBase {
  protected users: User[];
  protected nodes: TClusterNode[];
  protected dependencies: Dependency[] = [];
  protected context?: string;
  protected registry?: Registry;

  constructor(config: ClusterConfig<TClusterService, TClusterNode>) {
    const { users = [], nodes = [], dependencies = [], registry, ...restConfig } = config;

    super(restConfig);

    this.users = users.map((user) => (user instanceof User ? user : new User(user)));

    this.nodes = nodes.map((node) =>
      node instanceof ClusterNode ? node : this.createClusterNode({ host: node }),
    );

    dependencies.forEach((dependency) => this.addDependency(dependency));

    this.registry = registry;
  }

  protected abstract createClusterNode(config: ClusterNodeConfig): TClusterNode;

  addDependency(input: TClusterService | PartialFor<Dependency, 'cluster'>) {
    const dependency: Dependency =
      input instanceof ClusterService
        ? {
            service: input as TClusterService,
            cluster: this,
          }
        : {
            cluster: this,
            ...(input as PartialFor<Dependency, 'cluster'>),
          };

    this.dependencies = uniqDependencies([...this.dependencies, dependency]);
    return this;
  }

  isExternal(dependency: Dependency) {
    return dependency.cluster && dependency.cluster.name !== this.name;
  }

  getDependencies(includeExternal = false, includeDepends = false) {
    const dependencies: Dependency[] = [];

    this.dependencies.forEach((dependency) => {
      const isDependencyExternal = this.isExternal(dependency);

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

  getDependency(service: TClusterService) {
    const dependencies = this.getDependencies(false, true);

    const dependency = dependencies.find((dependency) => dependency.service === service);
    if (!dependency) {
      throw new Error(`Dependency ${service.name} not found in cluster ${this.name}`);
    }

    return dependency;
  }

  toRunner(user: User) {
    return user.clone({ username: 'runner', password: undefined });
  }

  getRegistries(currentRegistry?: Registry) {
    const registries: Registry[] = [];

    if (this.registry) {
      registries.push(this.registry);
    }

    if (currentRegistry) {
      registries.push(currentRegistry);
    }

    this.dependencies.forEach(({ service }) => {
      if (service.registry) {
        registries.push(service.registry);
      }
    });

    return uniq(registries);
  }

  async build(options: { registry?: Registry; context?: string; push?: boolean } = {}) {
    const { registry = this.registry, context = this.context, ...restOptions } = options;

    const dependencies = this.getDependencies(false, true);

    /*
    ~/.docker/config.json
    {
      "auths": {
        "registry1.example.com": {
          "auth": "base64-encoded-credentials"
        },
        "registry2.example.com": {
          "auth": "base64-encoded-credentials"
        }
        // More registries...
      }
    }
    // run in serial to avoid race conditions, for parallel I need to use specific DOCKER_CONFIG for each build with different credentials
    for (const service of services) {
      await service.build({
        registry,
        context,
        ...restOptions,
      });
    }
    */

    // I need to do it in serial to avoid race conditions
    for (const dependency of dependencies) {
      await dependency.service.build({
        registry,
        context,
        labels: {
          name: `${this.name}-${dependency.service.name}`,
        },
        ...restOptions,
      });
    }
  }

  async deployNode<TOptions extends {}>(
    node: TClusterNode,
    runner: User,
    manager: TClusterNode,
    options: TOptions,
  ) {
    await node.deploy(this.name, runner, manager, options);
  }

  async deploy<TDeployOptions extends { skipBuild?: boolean; registry?: Registry }>(
    options: TDeployOptions,
  ) {
    const { skipBuild = false, registry = this.registry, ...restOptions } = options;

    if (!skipBuild) {
      await this.build({ registry });
    }

    const { nodes, users } = this;

    const [admin, runner] = users;
    if (!admin) {
      throw new Error('Admin user is required for cluster setup');
    }

    const runnerUser = runner ?? this.toRunner(admin);

    const [manager, ...workers] = nodes;
    if (!manager) {
      throw new Error('Manager node is required for cluster setup');
    }

    // authentificate registries
    const registries = this.getRegistries(registry);
    await Promise.all(
      nodes.map((node) => node.authenticateRegistries(runnerUser, registries, manager)),
    );

    // primary node must be setup first, because other nodes will use it as a source of truth
    await this.deployNode(manager, runnerUser, manager, restOptions);

    await Promise.all(
      workers.map((worker) => this.deployNode(worker, runnerUser, manager, restOptions)),
    );
  }

  async setupNode(node: TClusterNode, admin: User, runner: User, manager: TClusterNode) {
    await node.setup(admin, runner, manager);
  }

  async setup() {
    const { nodes, users } = this;

    const [admin, runner] = users;
    if (!admin) {
      throw new Error('Admin user is required for cluster setup');
    }

    const runnerUser = runner ?? this.toRunner(admin);

    const [manager, ...workers] = nodes;
    if (!manager) {
      throw new Error('Manager node is required for cluster setup');
    }

    // primary node must be setup first, because other nodes will use it as a source of truth
    await this.setupNode(manager, admin, runnerUser, manager);

    await Promise.all(workers.map((worker) => this.setupNode(worker, admin, runnerUser, manager)));
  }

  toObject() {
    const { name, dependencies } = this;

    return {
      name,
      services: dependencies.map(({ cluster, service }) => service.toObject()),
    };
  }
}
