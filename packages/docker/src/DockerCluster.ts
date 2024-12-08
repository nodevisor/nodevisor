import YAML from 'yaml';
import Cluster, { ServiceScope, type ClusterConfig } from '@nodevisor/cluster';
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

  getNetworks(scope: ServiceScope) {
    const networks: NetworksTopLevel = {};

    // all networks are available for any internal cluster
    if (scope === ServiceScope.EXTERNAL) {
      return networks;
    }

    Object.entries(this.networks).forEach(([name, network]) => {
      networks[name] = {
        ...network,
      };
    });

    return networks;
  }

  getComposeNetworks(scope: ServiceScope) {
    const networks = this.getNetworks(scope);

    const externalServices =
      scope === ServiceScope.ALL ? [] : this.getServices(ServiceScope.EXTERNAL, true);

    const services = this.getServices(scope, true);
    services.forEach((service) => {
      const isExternal = externalServices.includes(service);
      const networkName = service.getNetworkName(this, scope);

      // create network for each service
      networks[networkName] = {
        driver: 'overlay',
        attachable: true,
        name: networkName, // use same network name otherwise traefik will not work
      };
    });

    if (scope === ServiceScope.INTERNAL) {
      // include all external services as external
      externalServices.forEach((service) => {
        const networkName = service.getNetworkName(this, scope);

        networks[networkName] = {
          external: true,
        };
      });
    }

    return networks;
  }

  getVolumes(scope: ServiceScope) {
    const volumes: VolumesTopLevel = {};

    if (scope === ServiceScope.EXTERNAL) {
      // volumes defined by user are used only in internal cluster
      return volumes;
    }

    Object.entries(this.volumes).forEach(([name, volume]) => {
      volumes[name] = {
        ...volume,
      };
    });

    return volumes;
  }

  getComposeVolumes(scope: ServiceScope) {
    const volumes = this.getVolumes(scope);

    const services = this.getServices(scope, true);
    services.map((service) => {
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

  getComposeServices(scope: ServiceScope, type: DockerClusterType = DockerClusterType.SWARM) {
    const services: Record<string, DockerComposeServiceConfig> = {};

    const allServices = this.getServices(scope, true);
    const externalServices =
      scope === ServiceScope.ALL ? [] : this.getServices(ServiceScope.EXTERNAL, true);

    allServices.forEach((service) => {
      const { networks = {}, ...serviceCompose } = service.toCompose(this, scope, type);

      // add current service network to networks
      networks[service.getNetworkName(this, scope)] = {
        // priority: 0, // swarm does not support priority
      };

      // add networks for each depends service
      service.getDependServices().forEach((dependService) => {
        const networkName = dependService.getNetworkName(this, scope);

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
      scope?: ServiceScope;
      type?: DockerClusterType;
    } = {},
  ) {
    const { scope, type, ...restOptions } = options;

    super.deploy({
      ...restOptions,
      yaml: this.yaml({ scope, type }),
    });
  }

  async setupNode(node: DockerNode, admin: User, runner: User, manager: DockerNode) {
    const token = await manager.getWorkerToken(runner);

    await node.setup(admin, runner, manager, { token });
  }

  toCompose(options: { scope?: ServiceScope; type?: DockerClusterType }): DockerComposeConfig {
    const { scope = ServiceScope.ALL, type = this.type } = options;
    const { name, externalName /* version */ } = this;

    const compose: DockerComposeConfig = {
      // version: version.toString(),
      services: this.getComposeServices(scope, type),
      volumes: this.getComposeVolumes(scope),
      networks: this.getComposeNetworks(scope),
    };

    if (type === DockerClusterType.COMPOSE) {
      // name is required for compose
      compose.name = scope === ServiceScope.EXTERNAL ? externalName : name;
    }

    return compose;
  }

  yaml(options: { scope?: ServiceScope; type?: DockerClusterType }) {
    const compose = this.toCompose(options);

    return YAML.stringify(compose);
  }
}
