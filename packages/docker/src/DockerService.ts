import { set } from 'lodash';
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
import type DockerVolume from './@types/DockerVolume';
import type DockerNetwork from './@types/DockerNetwork';
import type DockerDependency from './@types/DockerDependency';
import type ServiceVolume from './@types/ServiceVolume';
import toDockerVolumes from './utils/toDockerVolumes';
import type DockerHealthcheckConfig from './@types/DockerHealthcheckConfig';
import DockerHealthcheck from './DockerHealthcheck';

type PartialDockerComposeServiceConfig = Omit<
  DockerComposeServiceConfig,
  'image' | 'labels' | 'ports' | 'environment' | 'deploy' | 'networks' | 'volumes'
> & {
  deploy?: Omit<DockerComposeServiceConfig['deploy'], 'resources' | 'replicas'>;
  volumes?: ServiceVolume[];
  networks?: Record<string, DockerNetwork>;
  healthcheck?: DockerHealthcheckConfig;
};

export type DockerServiceConfig = ClusterServiceConfig & PartialDockerComposeServiceConfig;

export default class DockerService extends ClusterService {
  private config: PartialDockerComposeServiceConfig;
  private volumes: ServiceVolume[];
  private networks: Record<string, DockerNetwork>;
  readonly healthcheck: DockerHealthcheck;

  constructor(config: DockerServiceConfig) {
    const {
      name,
      image,
      builder,
      labels,
      ports,
      environment,
      cpus,
      memory,
      replicas,
      volumes = [],
      networks = {},
      context,
      registry,
      dependencies = [],
      healthcheck = {},
      ...rest
    } = config;

    super({
      name,
      image,
      builder,
      labels,
      environment,
      cpus,
      memory,
      replicas,
      ports,
      registry,
      context,
      dependencies,
    });

    this.config = rest;
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

  getDeploy(): Exclude<DockerComposeServiceConfig['deploy'], undefined> {
    const cpus = this.getCpus();
    const memory = this.getMemory();
    const replicas = this.getReplicas();

    const deploy: DockerComposeServiceConfig['deploy'] = {
      ...this.config.deploy,
    };

    set(deploy, 'resources.limits.cpus', cpus.max.toString());
    set(deploy, 'resources.reservations.cpus', cpus.min.toString());

    set(deploy, 'resources.limits.memory', memory.max);
    set(deploy, 'resources.reservations.memory', memory.min);

    set(deploy, 'replicas', replicas.min);

    return deploy;
  }

  toCompose(cluster: ClusterBase, type: ClusterType): DockerComposeServiceConfig {
    const { image } = this;

    return this.run(cluster, type, () => {
      const data: DockerComposeServiceConfig = {
        ...this.config,
        image,
        deploy: this.getDeploy(),
      };

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
