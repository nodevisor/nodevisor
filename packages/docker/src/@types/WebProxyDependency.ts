import type WebProxy from '../services/WebProxy';
import type DockerDependency from './DockerDependency';

type WebProxyDependency = Omit<DockerDependency, 'service'> & {
  service: WebProxy;
};

export default WebProxyDependency;
