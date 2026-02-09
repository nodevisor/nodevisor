import { Mode, PlacementType } from '@nodevisor/cluster';
import DockerService, { type DockerServiceConfig } from '../DockerService';
import { Protocol } from '@nodevisor/endpoint';
import type PortDockerService from './PortDockerService';
import generateWireGuardKey from '../utils/generateWireGuardKey';
import { existsSync, readFileSync } from 'node:fs';
import { type NodevisorProxy } from '@nodevisor/shell';

function generateClientKey(outPath: string = '~/wg-keys/client_private.key', overwrite = false) {
  generateWireGuardKey(outPath, overwrite);
}

function generateServerKey(outPath: string = '~/wg-keys/server_private.key', overwrite = false) {
  generateWireGuardKey(outPath, overwrite);
}

export type WireGuardConfig = Omit<DockerServiceConfig, 'dependencies'> & {
  version?: string;
  ip?: string;
  port?: number;
  serverPrivateKeyPath?: string;
  clientPrivateKeyPath?: string;
  publicKey: string;
  dependencies?: {
    service: PortDockerService;
    ip: string;
    port: number;
  }[];
};

export default class WireGuard extends DockerService {
  private readonly serverPrivateKeyPath: string;
  private readonly clientPrivateKeyPath: string;
  readonly port: number;

  constructor(config: WireGuardConfig) {
    const {
      version = '1.0.20210914',
      name = 'wireguard',
      image = `linuxserver/wireguard:${version}`,
      ip = '0.0.0.0',
      port = 51820,
      serverPrivateKeyPath = '~/wg-keys/nodevisor_server_private.key',
      clientPrivateKeyPath = '~/wg-keys/nodevisor_client_private.key',
      publicKey,
      dependencies = [],
      ...rest
    } = config;

    super({
      mode: Mode.GLOBAL,
      placement: PlacementType.MANAGER,
      name,
      image,
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
      sysctls: {
        'net.ipv4.conf.all.src_valid_mark': 1,
      },
      capabilities: {
        add: ['NET_ADMIN', 'SYS_MODULE'],
      },
      ...rest,
    });

    this.port = port;
    this.serverPrivateKeyPath = serverPrivateKeyPath;
    this.clientPrivateKeyPath = clientPrivateKeyPath;

    this.prepareKeys();
  }

  getVolumes() {
    const volumes = super.getVolumes();

    volumes.push({
      name: 'config',
      target: '/config',
      type: 'volume',
    });

    return volumes;
  }

  prepareKeys() {
    const serverPrivateKey = this.serverPrivateKeyPath;
    const clientPrivateKey = this.clientPrivateKeyPath;

    if (!existsSync(serverPrivateKey)) {
      generateServerKey(serverPrivateKey);
    }

    if (!existsSync(clientPrivateKey)) {
      generateClientKey(clientPrivateKey);
    }
  }

  getClientConfig() {
    const serverPrivateKeyPath = this.serverPrivateKeyPath;
    const clientPrivateKeyPath = this.clientPrivateKeyPath;

    const clientPrivateKey = readFileSync(clientPrivateKeyPath, 'utf8');
    const serverPublicKey = readFileSync(`${serverPrivateKeyPath}.pub`, 'utf8');

    return `
[Interface]
PrivateKey = ${clientPrivateKey}
Address    = 10.0.0.2/32
DNS        = 1.1.1.1

[Peer]
PublicKey  = ${serverPublicKey}
Endpoint   = vpn.example.com:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
    `;
  }

  getServerConfig() {
    const serverPrivateKeyPath = this.serverPrivateKeyPath;
    const clientPrivateKeyPath = this.clientPrivateKeyPath;

    const serverPrivateKey = readFileSync(serverPrivateKeyPath, 'utf8');
    const clientPublicKey = readFileSync(`${clientPrivateKeyPath}.pub`, 'utf8');

    const { port } = this;

    return `
[Interface]
PrivateKey = ${serverPrivateKey}
Address    = 10.0.0.1/24
ListenPort = ${port}

[Peer]
PublicKey  = ${clientPublicKey}
AllowedIPs = 10.0.0.2/32
    `;
  }

  getEnvironments() {
    const environments = super.getEnvironments();

    return {
      ...environments,
      PUID: 1000,
      PGID: 1000,
      TZ: 'Etc/UTC',
    };
  }

  setupClient($con: NodevisorProxy) {}
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
