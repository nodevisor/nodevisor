import { Mode, PlacementType, type PartialFor } from '@nodevisor/cluster';
import DockerService, { type DockerServiceConfig } from '../DockerService';
import { Protocol } from '@nodevisor/endpoint';
import PortDockerService from './PortDockerService';

export type SocatConfig = PartialFor<DockerServiceConfig, 'name'> & {
  version?: string;
  ip: string;
};

export default class Socat extends DockerService {
  constructor(config: SocatConfig) {
    const {
      version = '1.8.0.3',
      name = 'socat',
      image = `alpine/socat:${version}`,
      ip,
      dependencies = [],
      ...rest
    } = config;

    if (!dependencies.length) {
      throw new Error('Socat requires at least one dependency');
    }

    if (!dependencies.every((dep) => dep instanceof PortDockerService)) {
      throw new Error('All Socat dependencies must implement PortService');
    }

    super({
      mode: Mode.GLOBAL,
      placement: PlacementType.MANAGER,
      name,
      image,
      dependencies,
      command: Socat.prepareCommand(dependencies),
      ports: Socat.getPorts(dependencies, ip),
      ...rest,
    });
  }

  static prepareCommand(services: PortDockerService[]) {
    return services
      .map((service) => {
        const { port, name } = service;
        return `TCP-LISTEN:${port},fork,reuseaddr TCP:${name}:${port}`;
      })
      .join('; ');
  }

  static getPorts(services: PortDockerService[], ip: string) {
    return services.map((service) => {
      const { port } = service;
      return {
        target: port,
        published: port,
        ip,
        mode: 'host',
        protocol: Protocol.TCP,
      } as const;
    });
  }
}
