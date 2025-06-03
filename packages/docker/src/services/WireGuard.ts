import { Mode, PlacementType } from '@nodevisor/cluster';
import DockerService, { type DockerServiceConfig } from '../DockerService';
import { Protocol } from '@nodevisor/endpoint';
import type PortDockerService from './PortDockerService';

type WireGuardConfig = Omit<DockerServiceConfig, 'dependencies'> & {
  version?: string;
  ip?: string;
  port?: number;
  privateKey: string;
  // generate public key from private key automatically if not provided
  publicKey: string;
  dependencies?: {
    service: PortDockerService;
    ip: string;
    port: number;
  }[];
};

export default class WireGuard extends DockerService {
  private readonly privateKey: string;
  private readonly publicKey: string;

  constructor(config: WireGuardConfig) {
    const {
      restart = 'unless-stopped',
      version = '1.0.20210914',
      name = 'wireguard',
      image = `linuxserver/wireguard:${version}`,
      ip = '0.0.0.0',
      port = 51820,
      privateKey,
      publicKey,
      dependencies = [],
      ...rest
    } = config;

    super({
      mode: Mode.GLOBAL,
      placement: PlacementType.MANAGER,
      name,
      image,
      restart,
      // send only services for correct network access
      dependencies: dependencies.map((dep) => dep.service),
      ports: [
        {
          target: port,
          published: port,
          ip,
          mode: 'host',
          protocol: Protocol.UDP,
        },
      ],
      ...rest,
    });

    this.privateKey = privateKey;
    this.publicKey = publicKey;
  }
}

/*

  getVolumes() {
    const volumes = super.getVolumes();

    volumes.push({
      name: 'config',
      target: '/config',
      type: 'volume',
    });

    return volumes;
  }
    
getEnvironments() {
  const environments = super.getEnvironments();

  if (this.privateKey) {
    environments.PEERS = this.privateKey;
  }

  if (this.publicKey) {
    environments.PUBLIC_KEY = this.publicKey;
  }

  return environments;
}
*/
