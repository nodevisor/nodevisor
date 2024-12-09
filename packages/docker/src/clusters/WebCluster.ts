import DockerCluster, { type DockerClusterConfig } from '../DockerCluster';
import WebProxy from '../services/WebProxy';

type WebClusterConfig = DockerClusterConfig & {
  proxy: WebProxy;
};

export default class WebCluster extends DockerCluster {
  readonly proxy: WebProxy;

  constructor(config: WebClusterConfig) {
    const { proxy, dependencies = [], ...rest } = config;

    super({
      dependencies: [proxy, ...dependencies],
      ...rest,
    });

    this.proxy = proxy;
  }
}
