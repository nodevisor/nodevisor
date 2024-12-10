import DockerService, { type DockerServiceConfig } from '../DockerService';
import WebProxy from './WebProxy';
import type WebProxyDependency from '../@types/WebProxyDependency';
import { useCluster } from '@nodevisor/cluster';

export type WebConfig = DockerServiceConfig & {
  domains: string[];
  proxy: WebProxy | WebProxyDependency;
  port?: number;
};

export default class Web extends DockerService {
  readonly domains: string[];
  readonly proxy: WebProxyDependency;
  readonly port: number;

  constructor(config: WebConfig) {
    const { domains, proxy, port = 3000, ...rest } = config;

    super(rest);

    this.domains = domains;
    this.port = port;
    this.proxy = proxy instanceof WebProxy ? { service: proxy } : proxy;

    this.addDependency(this.proxy);
  }

  getLabels() {
    const cluster = useCluster();
    if (!cluster) {
      throw new Error('Cluster is not initialized. Use ClusterContext.run() to initialize it.');
    }

    const proxyCluster = this.proxy.cluster ?? cluster;

    const proxyLabels = this.proxy.service.getWebLabels(proxyCluster, this);

    return {
      ...super.getLabels(),
      ...proxyLabels,
    };
  }
}
