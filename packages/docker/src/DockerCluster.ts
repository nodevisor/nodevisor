import YAML from 'yaml';
import Cluster, { type ClusterConfig, ClusterService } from '@nodevisor/cluster';
import type DockerService from './DockerService';
import type DockerComposeConfig from './@types/DockerComposeConfig';
import type DockerComposeServiceConfig from './@types/DockerComposeServiceConfig';
import type NetworksTopLevel from './@types/NetworksTopLevel';
import type VolumesTopLevel from './@types/VolumesTopLevel';

export type DockerClusterConfig = ClusterConfig<DockerService> & {
  version?: number;
  networks?: NetworksTopLevel;
  volumes?: VolumesTopLevel;
};

export default class DockerCluster extends Cluster<DockerService> {
  private version: number;
  private networks: NetworksTopLevel = {};
  private volumes: VolumesTopLevel = {};

  constructor(config: DockerClusterConfig) {
    const { version = 3.8, networks = {}, volumes = {}, ...rest } = config;

    super(rest);

    // version is obsolete
    this.version = version;
    this.networks = networks;
    this.volumes = volumes;
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

  getComposeServices() {
    const services: Record<string, DockerComposeServiceConfig> = {};

    const allServices = this.getAllComposeServices();

    allServices.forEach((service) => {
      const { networks = {}, ...serviceCompose } = service.toCompose();

      // add current service network to networks
      networks[service.getNetworkName()] = {
        priority: 0,
      };

      // add networks for each depends service
      service.getDepends().forEach((depend) => {
        const { service: dependService } = depend;
        const networkName = dependService.getNetworkName();

        if (!networks[networkName]) {
          networks[networkName] = {
            priority: 0,
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

  toCompose(): DockerComposeConfig {
    const { name /* version */ } = this;

    return {
      name,
      // version: version.toString(),
      services: this.getComposeServices(),
      volumes: this.getComposeVolumes(),
      networks: this.getComposeNetworks(),
    };
  }

  yaml() {
    const compose = this.toCompose();

    return YAML.stringify(compose);
  }
}
