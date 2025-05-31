import { type PartialFor } from '@nodevisor/cluster';
import DockerService, { type DockerServiceConfig } from '../DockerService';
import { Protocol } from '@nodevisor/endpoint';
import PortService from './PortService';

type SocatConfig = PartialFor<DockerServiceConfig, 'name'> & {
  version?: string;
};

export default class Socat extends DockerService {
  constructor(config: SocatConfig) {
    const {
      restart = 'unless-stopped',
      version = '1.8.0.3',
      name = 'socat',
      image = `alpine/socat:${version}`,
      dependencies = [],
      ...rest
    } = config;

    if (!dependencies.length) {
      throw new Error('Socat requires at least one dependency');
    }

    if (!dependencies.every((dep) => dep instanceof PortService)) {
      throw new Error('All Socat dependencies must implement PortService');
    }

    super({
      name,
      image,
      restart,
      dependencies,
      command: Socat.prepareCommand(dependencies),
      ports: Socat.getPorts(dependencies),
      ...rest,
    });
  }

  static prepareCommand(services: PortService[]) {
    return services
      .map((service) => {
        const { port, name } = service;
        return `TCP-LISTEN:${port},fork,reuseaddr TCP:${name}:${port}`;
      })
      .join('; ');
  }

  static getPorts(services: PortService[]) {
    return services.map((service) => {
      const { port } = service;
      return {
        target: port,
        published: port,
        ip: '127.0.0.1',
        protocol: Protocol.TCP,
      };
    });
  }
}
