import { set } from 'lodash';
import { ClusterService, type ClusterServiceConfig } from '@nodevisor/cluster';
import type DockerComposeServiceConfig from './@types/DockerComposeServiceConfig';
import toDockerStringObject from './utils/toDockerStringObject';
import toDockerPorts from './utils/toDockerPorts';
import toDockerDepends from './utils/toDockerDepends';
import type Volume from './@types/Volume';
import type Network from './@types/Network';
import type Networks from './@types/Networks';
import type Depends from './@types/Depends';

type DependsOrService = Depends | DockerService;

type PartialDockerComposeServiceConfig = Omit<
  DockerComposeServiceConfig,
  'image' | 'labels' | 'ports' | 'environment' | 'deploy' | 'networks' | 'volumes'
> & {
  deploy?: Omit<DockerComposeServiceConfig['deploy'], 'resources' | 'replicas'>;
  volumes?: Volume[];
  networks?: Networks;
  depends?: DependsOrService[];
};

export type DockerServiceConfig = ClusterServiceConfig & PartialDockerComposeServiceConfig;

export default class DockerService extends ClusterService {
  private config: PartialDockerComposeServiceConfig;
  private volumes: Volume[];
  private networks: Networks;
  private depends: Depends[] = [];

  constructor(config: DockerServiceConfig) {
    const {
      name,
      image,
      labels,
      ports,
      environment,
      cpus,
      memory,
      replicas,
      volumes = [],
      networks = {},
      depends = [],
      ...rest
    } = config;

    super({
      name,
      image,
      labels,
      environment,
      cpus,
      memory,
      replicas,
      ports,
    });

    this.config = rest;
    this.volumes = volumes;
    this.networks = networks;

    depends.forEach((depend) => this.addDepends(depend));
  }

  addDepends(depend: DependsOrService) {
    const data: Depends =
      depend instanceof DockerService
        ? {
            service: depend,
            condition: 'service_started',
          }
        : depend;

    const { service } = data;

    service.setClusterName(this.clusterName);

    this.depends.push(data);
    return this;
  }

  setClusterName(clusterName: string | undefined) {
    super.setClusterName(clusterName);

    this.getDepends().forEach((depend) => {
      const { service } = depend;
      service.setClusterName(clusterName);
    });

    return this;
  }

  addVolume(volume: Volume) {
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

  getVolumeName(volume: Volume) {
    return `${this.name}_${volume.source}_volume`;
  }

  addNetwork(name: string, network: Network) {
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
    const networks: Networks = {};

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

  getDepends(): Depends[] {
    return this.depends.map((depend) => ({ condition: 'service_started', ...depend }));
  }

  hasDepends() {
    const depends = this.getDepends();
    return !!depends.length;
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

  toCompose(): DockerComposeServiceConfig {
    const { image } = this;

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
      data.volumes = this.getVolumes();
    }

    if (this.hasNetworks()) {
      data.networks = this.getNetworks();
    }

    if (this.hasPorts()) {
      data.ports = toDockerPorts(this.getPorts());
    }

    if (this.hasDepends()) {
      data.depends_on = toDockerDepends(this.getDepends());
    }

    return data;
  }
}
