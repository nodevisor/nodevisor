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
import Registry from '@nodevisor/registry';
import type DockerDependency from './@types/DockerDependency';

export type DockerClusterConfig = ClusterConfig<DockerService, DockerNode> & {
  type?: DockerClusterType;
  // version?: number;
  networks?: NetworksTopLevel;
  volumes?: VolumesTopLevel;
};

export default class DockerCluster extends Cluster<DockerService, DockerNode> {
  protected dependencies: DockerDependency[] = [];
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
    const volumes: VolumesTopLevel = {};

    Object.entries(this.volumes).forEach(([name, volume]) => {
      volumes[name] = {
        ...volume,
      };
    });

    return volumes;
  }

  getDependencies(includeExternal?: boolean, includeInternal?: boolean) {
    return super.getDependencies(includeExternal, includeInternal) as DockerDependency[];
  }

  getComposeVolumes() {
    const volumes = this.getVolumes();

    const dependencies = this.getDependencies(false, true);
    dependencies.forEach((dependency) => {
      const { service } = dependency;

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

  getComposeServices(type: DockerClusterType = DockerClusterType.SWARM) {
    const services: Record<string, DockerComposeServiceConfig> = {};

    const dependencies = this.getDependencies(false, true);

    dependencies.forEach((dependency) => {
      const { service, cluster } = dependency;

      const { networks = {}, ...serviceCompose } = service.toCompose(cluster, type);

      // add current service network to networks
      networks[service.getNetworkName(cluster)] = {
        // priority: 0, // swarm does not support priority
      };

      // add networks for each depends service
      service.getDependencies(cluster, true).forEach((serviceDependency) => {
        const networkName = serviceDependency.service.getNetworkName(serviceDependency.cluster);

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

  toCompose(options: { type?: DockerClusterType }): DockerComposeConfig {
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

  yaml(options: { type?: DockerClusterType }) {
    const compose = this.toCompose(options);

    return YAML.stringify(compose);
  }
}
