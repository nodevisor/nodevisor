import { User, UserConfig } from '@nodevisor/core';
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
};

export default abstract class Cluster<
  TClusterService extends ClusterService,
  TClusterNode extends ClusterNode,
> {
  readonly name: string;
  protected users: User[];
  protected nodes: TClusterNode[];
  protected services: TClusterService[] = [];

  constructor(config: ClusterConfig<TClusterService, TClusterNode>) {
    const { name, users = [], nodes = [], services = [] } = config;

    this.name = name;

    this.users = users.map((user) => (user instanceof User ? user : new User(user)));

    this.nodes = nodes.map((node) =>
      node instanceof ClusterNode ? node : this.createClusterNode({ host: node }),
    );

    services.forEach((service) => this.addService(service));
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

  async deployNode(node: TClusterNode, runner: User, manager: TClusterNode) {
    await node.deploy(runner, manager);
  }

  async deploy() {
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
