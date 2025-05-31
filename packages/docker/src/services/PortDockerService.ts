import DockerService, { type DockerServiceConfig } from '../DockerService';

export type PortDockerServiceConfig = DockerServiceConfig & {
  port?: number;
};

export default class PortDockerService extends DockerService {
  readonly port: number;

  constructor(config: PortDockerServiceConfig) {
    const { port, ...rest } = config;

    if (!port) {
      throw new Error('Port is required');
    }

    super(rest);

    this.port = port;
  }
}
