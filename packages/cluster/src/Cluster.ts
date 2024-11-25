import { User, UserConfig } from '@nodevisor/core';
import { uniq } from 'lodash';
import Registry from '@nodevisor/registry';
import ClusterService from './ClusterService';
import ClusterNode, { type ClusterNodeConfig } from './ClusterNode';

export type ClusterConfig<
  TClusterService extends ClusterService,
  TClusterNode extends ClusterNode,
> = {
  name: string;
  users?: Array<User | UserConfig>;
  nodes?: Array<TClusterNode | string>;
  services?: TClusterService[];
  context?: string;
  registry?: Registry;
};

export default abstract class Cluster<
  TClusterService extends ClusterService,
  TClusterNode extends ClusterNode,
> {
  readonly name: string;
  protected users: User[];
  protected nodes: TClusterNode[];
  protected services: TClusterService[] = [];
  protected context?: string;
  protected registry?: Registry;

  constructor(config: ClusterConfig<TClusterService, TClusterNode>) {
    const { name, users = [], nodes = [], services = [], registry } = config;

    this.name = name;

    this.users = users.map((user) => (user instanceof User ? user : new User(user)));

    this.nodes = nodes.map((node) =>
      node instanceof ClusterNode ? node : this.createClusterNode({ host: node }),
    );

    services.forEach((service) => this.addService(service));

    this.registry = registry;
  }

  protected abstract createClusterNode(config: ClusterNodeConfig): TClusterNode;

  addService(service: TClusterService) {
    service.setClusterName(this.name);

    this.services = [...this.services, service];
    return this;
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

    this.services.forEach((service) => {
      if (service.registry) {
        registries.push(service.registry);
      }
    });

    return uniq(registries);
  }

  async build(options: { registry?: Registry; context?: string; push?: boolean } = {}) {
    const { registry = this.registry, context = this.context, ...restOptions } = options;
    const { services } = this;

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

    await Promise.all(
      services.map((service) =>
        service.build({
          registry,
          context,
          ...restOptions,
        }),
      ),
    );
  }

  async deployNode(node: TClusterNode, runner: User, manager: TClusterNode) {
    await node.deploy(runner, manager);
  }

  async deploy(options: { skipBuild?: boolean; registry?: Registry } = {}) {
    const { skipBuild = false, registry = this.registry } = options;

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
    await this.deployNode(manager, runnerUser, manager);

    await Promise.all(workers.map((worker) => this.deployNode(worker, runnerUser, manager)));
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
    const { name, services = [] } = this;

    return {
      name,
      services: services.map((service) => service.toObject()),
    };
  }
}
