import YAML from 'yaml';
import Cluster, { type ClusterConfig } from '@nodevisor/cluster';
import DockerNode, { type DockerNodeConfig } from './DockerNode';
import type DockerService from './DockerService';
import type DockerComposeConfig from './@types/DockerComposeConfig';
import type DockerComposeServiceConfig from './@types/DockerComposeServiceConfig';
import type DockerNetworkTopLevel from './@types/DockerNetworkTopLevel';
import type DockerVolumeTopLevel from './@types/DockerVolumeTopLevel';
import { User } from '@nodevisor/core';
import DockerClusterType from './constants/DockerClusterType';
import Registry from '@nodevisor/registry';
import type DockerDependency from './@types/DockerDependency';
import type DockerNetwork from './@types/DockerNetwork';
import WebProxy from './services/WebProxy';
import type WebProxyDependency from './@types/WebProxyDependency';

export type DockerClusterConfig = ClusterConfig<DockerService, DockerNode> & {
  type?: DockerClusterType;
  // version?: number;
  networks?: Record<string, DockerNetworkTopLevel>;
  volumes?: Record<string, DockerVolumeTopLevel>;
};

export default class DockerCluster extends Cluster<DockerService, DockerNode> {
  readonly type: DockerClusterType;
  // private version: number;
  private networks: Record<string, DockerNetworkTopLevel> = {};
  private volumes: Record<string, DockerVolumeTopLevel> = {};

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
    _cluster: DockerCluster,
    _service: DockerService,
    type: DockerClusterType,
  ) {
    const network: DockerNetwork = {};
    if (type === DockerClusterType.COMPOSE) {
      network.priority = 0; // swarm does not support priority
    }

    return network;
  }

  getComposeNetworks() {
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
        networks[networkName] = {
          driver: 'overlay',
          attachable: true,
          name: networkName, // use same network name otherwise traefik will not work
        };
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

    /* - extract top level volumes from services
    const dependencies = this.getDependencies(false, true);
    dependencies.forEach((dependency) => {
      const { cluster, service } = dependency;

      const serviceVolumes = service.getVolumes();

      serviceVolumes.forEach((volume) => {
        if (volume.type === 'volume') {
          volumes[volume.source] = {
            driver: 'local',
            name: service.getVolumeName(cluster, volume),
          };
        }
      });
    });
    */

    return volumes;
  }

  getComposeServices(type: DockerClusterType = DockerClusterType.SWARM) {
    const services: Record<string, DockerComposeServiceConfig> = {};

    const dependencies = this.getDependencies(false, true);

    dependencies.forEach((dependency) => {
      const { service, cluster } = dependency;

      const { networks = {}, ...serviceCompose } = service.toCompose(cluster, type);

      const network: DockerNetwork = {};
      if (type === DockerClusterType.COMPOSE) {
        network.priority = 0; // swarm does not support priority
      }

      // add current service network to networks
      networks[service.getNetworkName(cluster)] = this.getServiceComposeNetwork(
        cluster,
        service,
        type,
      );

      // add networks for each depends service
      service.getDependencies(cluster, true, true).forEach((serviceDependency) => {
        const networkName = serviceDependency.service.getNetworkName(serviceDependency.cluster);

        if (!networks[networkName]) {
          networks[networkName] = this.getServiceComposeNetwork(
            serviceDependency.cluster,
            serviceDependency.service,
            type,
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
      type?: DockerClusterType;
    } = {},
  ) {
    const { type, ...restOptions } = options;

    super.deploy({
      ...restOptions,
      yaml: this.yaml({ type }),
    });
  }

  async setupNode(node: DockerNode, admin: User, runner: User, manager: DockerNode) {
    const token = await manager.getWorkerToken(runner);

    await node.setup(admin, runner, manager, { token });
  }

  toCompose(options: { type?: DockerClusterType } = {}): DockerComposeConfig {
    const { type = this.type } = options;
    const { name /* version */ } = this;

    const compose: DockerComposeConfig = {
      // version: version.toString(),
      services: this.getComposeServices(type),
      volumes: this.getComposeVolumes(),
      networks: this.getComposeNetworks(),
    };

    if (type === DockerClusterType.COMPOSE) {
      // name is required for compose
      compose.name = name;
    }

    return compose;
  }

  yaml(options: { type?: DockerClusterType } = {}) {
    const compose = this.toCompose(options);

    return YAML.stringify(compose);
  }
}
