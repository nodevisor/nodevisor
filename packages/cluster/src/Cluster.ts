import { User } from '@nodevisor/core';
import ClusterService from './ClusterService';
import ClusterNode from './ClusterNode';

type ClusterNodeOrString = ClusterNode | string;

export type ClusterConfig<TClusterService extends ClusterService> = {
  name: string;
  users?: User[];
  nodes?: ClusterNodeOrString[];
  services?: TClusterService[];
};

export default abstract class Cluster<TClusterService extends ClusterService> {
  readonly name: string;
  protected users: User[];
  protected nodes: ClusterNode[];
  protected services: TClusterService[] = [];

  constructor(config: ClusterConfig<TClusterService>) {
    const { name, users = [], nodes = [], services = [] } = config;

    this.name = name;
    this.users = users;

    this.nodes = nodes.map((node) =>
      node instanceof ClusterNode ? node : new ClusterNode({ host: node }),
    );

    services.forEach((service) => this.addService(service));
  }

  addService(service: TClusterService) {
    service.setClusterName(this.name);

    this.services = [...this.services, service];
    return this;
  }

  async setup() {
    const { nodes, users } = this;

    const [setupUser, nonRootUser] = users;
    if (!setupUser) {
      throw new Error('Setup user is required for cluster setup');
    }

    const runnerUser =
      nonRootUser ??
      setupUser.clone({
        username: 'runner',
        // remove root password from runner user because it's not needed
        password: undefined,
      });

    await Promise.all(
      nodes.map(async (node, index) => {
        const isPrimary = index === 0;
        await node.setup(setupUser, runnerUser, isPrimary);
      }),
    );
  }

  toObject() {
    const { name, services = [] } = this;

    return {
      name,
      services: services.map((service) => service.toObject()),
    };
  }
}
