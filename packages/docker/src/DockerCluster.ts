import YAML from 'yaml';
import Cluster, { type ClusterConfig } from '@nodevisor/cluster';
import DockerNode, { type DockerNodeConfig } from './DockerNode';
import type DockerService from './DockerService';
import type DockerComposeConfig from './@types/DockerComposeConfig';
import type DockerComposeServiceConfig from './@types/DockerComposeServiceConfig';
import type NetworksTopLevel from './@types/NetworksTopLevel';
import type VolumesTopLevel from './@types/VolumesTopLevel';
import { User } from '@nodevisor/core';
// import DockerCompose from './DockerCompose';
import DockerClusterType from './constants/DockerClusterType';

export type DockerClusterConfig = ClusterConfig<DockerService, DockerNode> & {
  type?: DockerClusterType;
  // version?: number;
  networks?: NetworksTopLevel;
  volumes?: VolumesTopLevel;
};

export default class DockerCluster extends Cluster<DockerService, DockerNode> {
  readonly type: DockerClusterType;
  // private version: number;
  private networks: NetworksTopLevel = {};
  private volumes: VolumesTopLevel = {};

  constructor(config: DockerClusterConfig) {
    const {
      /* version = 3.8, */ networks = {},
      volumes = {},
      type = DockerClusterType.SWARM,
      ...rest
    } = config;

    super(rest);

    // version is obsolete
    // this.version = version;
    this.type = type;
    this.networks = networks;
    this.volumes = volumes;
  }

  protected createClusterNode(config: DockerNodeConfig) {
    return new DockerNode(config);
  }

  getNetworks() {
    const networks: NetworksTopLevel = {};

    Object.entries(this.networks).forEach(([name, network]) => {
      networks[name] = {
        ...network,
      };
    });

    return networks;
  }

  getComposeNetworks() {
    const networks = this.getNetworks();

    const allServices = this.getAllComposeServices();

    allServices.forEach((service) => {
      const networkName = service.getNetworkName();

      // create network for each service
      networks[networkName] = {
        driver: 'overlay',
        attachable: true,
        name: networkName, // use same network name otherwise traefik will not work
      };
    });

    return networks;
  }

  getVolumes() {
    const volumes: VolumesTopLevel = {};

    Object.entries(this.volumes).forEach(([name, volume]) => {
      volumes[name] = {
        ...volume,
      };
    });

    return volumes;
  }

  getComposeVolumes() {
    const volumes = this.getVolumes();

    const allServices = this.getAllComposeServices();

    allServices.map((service) => {
      const serviceVolumes = service.getVolumes();

      serviceVolumes.forEach((volume) => {
        if (volume.type === 'volume') {
          volumes[volume.source] = {
            driver: 'local',
            name: service.getVolumeName(volume),
          };
        }
      });
    });

    return volumes;
  }

  getAllComposeServices(): DockerService[] {
    const services: Set<DockerService> = new Set(this.services);

    this.services.forEach((service) => {
      service.getDepends().forEach((depend) => {
        const { service: dependService } = depend;

        services.add(dependService);
      });
    });

    return Array.from(services);
  }

  getComposeServices(type: DockerClusterType = DockerClusterType.SWARM) {
    const services: Record<string, DockerComposeServiceConfig> = {};

    const allServices = this.getAllComposeServices();

    allServices.forEach((service) => {
      const { networks = {}, ...serviceCompose } = service.toCompose(type);

      // add current service network to networks
      networks[service.getNetworkName()] = {
        // priority: 0, // swarm does not support priority
      };

      // add networks for each depends service
      service.getDepends().forEach((depend) => {
        const { service: dependService } = depend;
        const networkName = dependService.getNetworkName();

        if (!networks[networkName]) {
          networks[networkName] = {
            // priority: 0,
          };
        }
      });

      services[service.name] = {
        networks,
        ...serviceCompose,
      };
    });

    return services;
  }

  async deployNode(node: DockerNode, runner: User, manager: DockerNode) {
    const yaml = this.yaml();

    await node.deploy(this.name, runner, manager, { yaml, type: this.type });
  }

  async setupNode(node: DockerNode, admin: User, runner: User, manager: DockerNode) {
    const token = await manager.getWorkerToken(runner);

    await node.setup(admin, runner, manager, { token });
  }

  toCompose(): DockerComposeConfig {
    const { name, type /* version */ } = this;

    return {
      name,
      // version: version.toString(),
      services: this.getComposeServices(type),
      volumes: this.getComposeVolumes(),
      networks: this.getComposeNetworks(),
    };
  }

  yaml() {
    const compose = this.toCompose();

    return YAML.stringify(compose);
  }
}
