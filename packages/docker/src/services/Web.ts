import DockerService, { type DockerServiceConfig } from '../DockerService';
import type WebProxy from './WebProxy';
import type Depends from '../@types/Depends';
import { ClusterBase } from '@nodevisor/cluster';

export type WebConfig = DockerServiceConfig & {
  domains: string[];
  proxy: WebProxy;
  port?: number;
};

export default class Web extends DockerService {
  readonly domains: string[];
  readonly proxy: WebProxy;
  readonly port: number;

  constructor(config: WebConfig) {
    const { domains, proxy, port = 3000, ...rest } = config;

    super(rest);

    this.proxy = proxy;
    this.domains = domains;
    this.port = port;
  }

  getDepends(): Depends[] {
    const depends = super.getDepends();
    return [
      ...depends,
      {
        service: this.proxy,
        condition: 'service_started',
      },
    ];
  }

  getLabels(cluster: ClusterBase, scope: ServiceScope) {
    return {
      ...super.getLabels(),
      ...this.proxy.getWebLabels(this),
    };
  }
}
