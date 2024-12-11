import type DockerService from '../DockerService';
import type DockerCluster from '../DockerCluster';
import DockerDependsOn from './DockerDependsOn';

type DockerDependency = DockerDependsOn & {
  service: DockerService;
  cluster: DockerCluster;
};

export default DockerDependency;
