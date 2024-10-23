import YAML from 'yaml';
import ClusterService from './ClusterService';
import ClusterNode from './ClusterNode';
import ClusterUser from './ClusterUser';
import type Volume from './@types/Volume';
import type Registry from './@types/Registry';

export type ClusterConfig = {
  name: string;
  users: ClusterUser[]; // first user is setup user, second is runner/deploy user
  nodes: ClusterNode[]; // first node is primary node, others are secondary nodes
  services?: ClusterService[];
  registry?: Registry; // default registry
};

export default class Cluster {
  private config: ClusterConfig;

  constructor(config: ClusterConfig) {
    const { users } = config;

    if (!users.length) {
      throw new Error('Users are required for cluster setup');
    }

    this.config = config;
  }

  async setup() {
    const { nodes, users } = this.config;

    const [setupUser, nonRootUser] = users;
    if (!setupUser) {
      throw new Error('Setup user is required for cluster setup');
    }

    const runnerUser = nonRootUser ?? setupUser.clone('runner');

    await Promise.all(
      nodes.map(async (node, index) => {
        const isPrimary = index === 0;
        await node.setup(setupUser, runnerUser, isPrimary);
      }),
    );
  }

  getBackendNetworkName() {
    const { name } = this.config;
    return `${name}-backend`;
  }

  async getDockerServicesConfig() {
    const { name, services = [] } = this.config;

    const backendNetworkName = this.getBackendNetworkName();
    const servicesConfig: Record<string, any> = {};

    await Promise.all(
      services.map(async (service) => {
        const serviceName = service.name;
        const network = `${name}-${serviceName}`;

        const { networks = [], ...config } = await service.getDockerConfig();

        servicesConfig[serviceName] = {
          ...config,
          networks: [backendNetworkName, network, ...networks],
        };
      }),
    );

    return servicesConfig;
  }

  async getDockerVolumesConfig() {
    const { services = [] } = this.config;

    let volumesConfig: Record<string, Volume> = {};

    await Promise.all(
      services.map(async (service) => {
        const volumes = await service.getDockerVolumes();

        volumesConfig = { ...volumesConfig, ...volumes };
      }),
    );

    return volumesConfig;
  }

  async getDockerComposeConfig() {
    const services = await this.getDockerServicesConfig();
    const volumes = await this.getDockerVolumesConfig();

    const backendNetworkName = this.getBackendNetworkName();

    return {
      version: '3.8',
      services,
      volumes,

      networks: {
        [backendNetworkName]: {
          driver: 'overlay',
          // allow other services to join the network
          // The --attachable option enables both standalone containers and Swarm services to connect to the overlay network.
          // Without --attachable, only Swarm services can connect to the network.
          attachable: true,
        },
      },
    };
  }

  async getDockerComposeYAML() {
    const config = await this.getDockerComposeConfig();
    return YAML.stringify(config);
  }
}
