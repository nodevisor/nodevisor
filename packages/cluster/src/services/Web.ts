import ClusterService, { type ClusterServiceConfig } from '../ClusterService';
import type WebProxy from './WebProxy';
import toDockerLabels from '../utils/toDockerLabels';

type WebConfig = ClusterServiceConfig & {
  domains: string[];
  proxy: WebProxy;
  port?: number;
};

export default abstract class Web extends ClusterService {
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

  getDockerConfig() {
    const config = super.getDockerConfig();
    const labels = this.proxy.getWebLabels(this);

    return {
      ...config,
      labels: {
        ...config.labels,
        ...toDockerLabels(labels),
      },
    };
  }
}
