import {
  ClusterService,
  type ClusterServiceConfig,
  ClusterBase,
  ClusterType,
} from '@nodevisor/cluster';
import type DockerComposeServiceConfig from './@types/DockerComposeServiceConfig';
import toDockerStringObject from './utils/toDockerStringObject';
import toDockerPorts from './utils/toDockerPorts';
import toDockerDepends from './utils/toDockerDepends';
import type DockerNetwork from './@types/DockerNetwork';
import type DockerDependency from './@types/DockerDependency';
import type ServiceVolume from './@types/ServiceVolume';
import toDockerVolumes from './utils/toDockerVolumes';
import type DockerHealthcheckConfig from './@types/DockerHealthcheckConfig';
import DockerHealthcheck from './DockerHealthcheck';
import toDockerRestart from './utils/toDockerRestart';
import toDockerDeploy from './utils/toDockerDeploy';

type PartialDockerComposeServiceConfig = {
  volumes?: ServiceVolume[];
  networks?: Record<string, DockerNetwork>;
  healthcheck?: DockerHealthcheckConfig;
};

export type DockerServiceConfig = ClusterServiceConfig & PartialDockerComposeServiceConfig;

export default class DockerService extends ClusterService {
  private volumes: ServiceVolume[];
  private networks: Record<string, DockerNetwork>;
  readonly healthcheck: DockerHealthcheck;

  constructor(config: DockerServiceConfig) {
    const { volumes = [], networks = {}, healthcheck = {}, ...rest } = config;

    super(rest);

    this.volumes = volumes;
    this.networks = networks;
    this.healthcheck = new DockerHealthcheck(healthcheck);
  }

  getDependencies(cluster: ClusterBase, includeExternal?: boolean, includeDepends?: boolean) {
    return super.getDependencies(cluster, includeExternal, includeDepends) as DockerDependency[];
  }

  addVolume(volume: ServiceVolume) {
    this.volumes.push(volume);
    return this;
  }

  getVolumes() {
    return this.volumes.map((volume) => ({ ...volume }));
  }

  hasVolumes() {
    const volumes = this.getVolumes();
    return !!volumes.length;
  }

  addNetwork(name: string, network: DockerNetwork) {
    if (this.networks[name]) {
      throw new Error(`Network ${name} already exists`);
    }

    this.networks[name] = network;
    return this;
  }

  removeNetwork(name: string) {
    delete this.networks[name];
    return this;
  }

  getNetworks() {
    const networks: Record<string, DockerNetwork> = {};

    Object.entries(this.networks).forEach(([name, network]) => {
      networks[name] = {
        ...network,
      };
    });

    return networks;
  }

  hasNetworks() {
    const networks = this.getNetworks();
    return !!Object.keys(networks).length;
  }

  getExtraHosts(_cluster: ClusterBase) {
    return {};
  }

  toCompose(cluster: ClusterBase, type: ClusterType): DockerComposeServiceConfig {
    const { image } = this;

    return this.run(cluster, type, () => {
      const data: DockerComposeServiceConfig = {
        image,
        deploy: toDockerDeploy(this, type),
      };

      // only compose supports restart
      if (type === ClusterType.DOCKER_COMPOSE) {
        data.restart = toDockerRestart(this, type);
      }

      const capabilities = this.getCapabilities();
      if (capabilities.add?.length) {
        data.cap_add = capabilities.add;
      }

      if (capabilities.drop?.length) {
        data.cap_drop = capabilities.drop;
      }

      if (this.hasSysctls()) {
        data.sysctls = toDockerStringObject(this.getSysctls());
      }

      if (this.hasCommand()) {
        data.command = this.getCommand().toString();
      }

      if (this.hasEnvironments()) {
        data.environment = toDockerStringObject(this.getEnvironments());
      }

      if (this.hasLabels()) {
        data.labels = toDockerStringObject(this.getLabels());
      }

      if (this.hasVolumes()) {
        data.volumes = toDockerVolumes(cluster, this, this.getVolumes());
      }

      if (this.hasNetworks()) {
        data.networks = this.getNetworks();
      }

      if (this.hasPorts()) {
        data.ports = toDockerPorts(this.getPorts(), type);
      }

      const extraHosts = this.getExtraHosts(cluster);
      if (Object.keys(extraHosts).length) {
        data.extra_hosts = extraHosts;
      }

      const dependencies = this.getDependencies(cluster);
      if (dependencies.length) {
        data.depends_on = toDockerDepends(dependencies, type);
      }

      const healthcheck = this.healthcheck.toCompose();
      if (healthcheck) {
        data.healthcheck = healthcheck;
      }

      return data;
    });
  }
}
