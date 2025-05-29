import YAML from 'yaml';
import Cluster, { type ClusterConfig, ClusterType } from '@nodevisor/cluster';
import DockerNode, { type DockerNodeConfig } from './DockerNode';
import type DockerService from './DockerService';
import type DockerComposeConfig from './@types/DockerComposeConfig';
import type DockerComposeServiceConfig from './@types/DockerComposeServiceConfig';
import type DockerNetworkTopLevel from './@types/DockerNetworkTopLevel';
import type DockerVolumeTopLevel from './@types/DockerVolumeTopLevel';
import { User } from '@nodevisor/core';
import Registry from '@nodevisor/registry';
import type DockerDependency from './@types/DockerDependency';
import type DockerNetwork from './@types/DockerNetwork';
import WebProxy from './services/WebProxy';
import type WebProxyDependency from './@types/WebProxyDependency';
import Web from './services/Web';

export type DockerClusterConfig = ClusterConfig<DockerService, DockerNode> & {
  type?: ClusterType;
  // version?: number;
  networks?: Record<string, DockerNetworkTopLevel>;
  volumes?: Record<string, DockerVolumeTopLevel>;
};

export default class DockerCluster extends Cluster<DockerService, DockerNode> {
  readonly type: ClusterType;
  // private version: number;
  private networks: Record<string, DockerNetworkTopLevel> = {};
  private volumes: Record<string, DockerVolumeTopLevel> = {};

  constructor(config: DockerClusterConfig) {
    const {
      /* version = 3.8, */ networks = {},
      volumes = {},
      type = ClusterType.DOCKER_SWARM,
      ...rest
    } = config;

    super(rest);

    // version is obsolete
    // this.version = version;
    this.type = type;
    this.networks = networks;
    this.volumes = volumes;
  }

  getDependencies(includeExternal?: boolean, includeDepends?: boolean) {
    return super.getDependencies(includeExternal, includeDepends) as DockerDependency[];
  }

  getDependency(service: WebProxy): WebProxyDependency;
  getDependency(service: DockerService): DockerDependency;
  getDependency(service: DockerService | WebProxy) {
    return super.getDependency(service);
  }

  protected createClusterNode(config: DockerNodeConfig) {
    return new DockerNode(config);
  }

  getNetworks() {
    const networks: Record<string, DockerNetworkTopLevel> = {};

    Object.entries(this.networks).forEach(([name, network]) => {
      networks[name] = {
        ...network,
      };
    });

    return networks;
  }

  getServiceComposeNetwork(
    cluster: DockerCluster,
    service: DockerService,
    type: ClusterType,
    isDependency: boolean = false,
  ) {
    const network: DockerNetwork = {};
    if (type === ClusterType.DOCKER_COMPOSE) {
      network.priority = 0; // swarm does not support priority
    }

    const allDependencies = cluster.getDependencies(false, true);

    // add aliases into web proxy
    if (service instanceof WebProxy && !isDependency) {
      const aliases = new Set<string>();

      allDependencies.forEach((dependency) => {
        const { service: dependencyService } = dependency;
        if (dependencyService instanceof Web && service === dependencyService.proxy.service) {
          const { domains } = dependencyService;

          domains.forEach((domain) => {
            aliases.add(domain);
          });
        }
      });

      if (aliases.size > 0) {
        network.aliases = Array.from(aliases);
      }
    }

    return network;
  }

  getComposeNetworks(type: ClusterType) {
    const networks = this.getNetworks();

    const dependencies = this.getDependencies(true, true);
    dependencies.forEach((dependency) => {
      const isExternal = this.isExternal(dependency);
      const networkName = dependency.service.getNetworkName(dependency.cluster);

      if (isExternal) {
        networks[networkName] = {
          external: true,
        };
      } else {
        if (type === ClusterType.DOCKER_COMPOSE) {
          networks[networkName] = {
            driver: 'bridge',
            attachable: true,
            name: networkName, // use same network name otherwise traefik will not work
          };
        } else {
          networks[networkName] = {
            driver: 'overlay',
            attachable: true,
            name: networkName, // use same network name otherwise traefik will not work
          };
        }
      }
    });

    return networks;
  }

  getVolumes() {
    const volumes: Record<string, DockerVolumeTopLevel> = {};

    Object.entries(this.volumes).forEach(([name, volume]) => {
      volumes[name] = {
        ...volume,
      };
    });

    return volumes;
  }

  getComposeVolumes() {
    const volumes = this.getVolumes();

    // - extract top level volumes from services
    const dependencies = this.getDependencies(false, true);
    dependencies.forEach((dependency) => {
      const { cluster, service } = dependency;

      const serviceVolumes = service.getVolumes();
      serviceVolumes.forEach((volume) => {
        if (volume.type === 'volume') {
          // volume need to have top level for type === volume
          const uniqueName = volume.source ?? service.getVolumeName(cluster, volume);
          volumes[uniqueName] = {
            driver: 'local',
          };
        } else if (volume.topLevel) {
          /*
          if (volume.type === 'volume') {
            volumes[volume.source] = {
              driver: 'local',
              name: service.getVolumeName(cluster, volume),
            };
          }
          */
        }
      });
    });

    return volumes;
  }

  getComposeServices(type: ClusterType = ClusterType.DOCKER_SWARM) {
    const services: Record<string, DockerComposeServiceConfig> = {};

    const dependencies = this.getDependencies(false, true);

    dependencies.forEach((dependency) => {
      const { service, cluster } = dependency;

      const { networks = {}, ...serviceCompose } = service.toCompose(cluster, type);

      const network: DockerNetwork = {};
      if (type === ClusterType.DOCKER_COMPOSE) {
        network.priority = 0; // swarm does not support priority
      }

      const networkName = service.getNetworkName(cluster);

      // add current service network to networks
      networks[networkName] = this.getServiceComposeNetwork(cluster, service, type);

      // add networks for each depends service, only direct dependencies need to have access to each other via networks
      service.getDependencies(cluster, true, false).forEach((serviceDependency) => {
        const dependencyNetworkName = serviceDependency.service.getNetworkName(
          serviceDependency.cluster,
        );

        if (!networks[dependencyNetworkName]) {
          networks[dependencyNetworkName] = this.getServiceComposeNetwork(
            serviceDependency.cluster,
            serviceDependency.service,
            type,
            true,
          );
        }
      });

      services[service.name] = {
        networks,
        ...serviceCompose,
      };
    });

    return services;
  }

  async deploy(
    options: {
      skipBuild?: boolean;
      registry?: Registry;
      type?: ClusterType;
    } = {},
  ) {
    const { type, ...restOptions } = options;

    await super.deploy({
      ...restOptions,
      yaml: this.yaml({ type }),
    });
  }

  async setupNode(node: DockerNode, admin: User, runner: User, manager: DockerNode) {
    const isManager = node === manager;

    const options: { token?: string } = {};
    if (!isManager) {
      options.token = await manager.getWorkerToken(runner);
    }

    await node.setup(admin, runner, manager, options);
  }

  toCompose(options: { type?: ClusterType } = {}): DockerComposeConfig {
    const { type = this.type } = options;
    const { name /* version */ } = this;

    const compose: DockerComposeConfig = {
      // version: version.toString(),
      services: this.getComposeServices(type),
      volumes: this.getComposeVolumes(),
      networks: this.getComposeNetworks(type),
    };

    if (type === ClusterType.DOCKER_COMPOSE) {
      // name is required for compose
      compose.name = name;
    }

    return compose;
  }

  yaml(options: { type?: ClusterType } = {}) {
    const compose = this.toCompose(options);

    return YAML.stringify(compose);
  }
}
