import type WebProxy from '../services/WebProxy';
import type DockerCluster from '../DockerCluster';

type WebProxyDependency = {
  service: WebProxy;
  cluster?: DockerCluster;
};

export default WebProxyDependency;
