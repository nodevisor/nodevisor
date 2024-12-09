import type DockerService from '../DockerService';
import type DockerCluster from '../DockerCluster';

type DockerDependency = {
  service: DockerService;
  cluster: DockerCluster;
  condition?: 'service_started' | 'service_healthy' | 'service_completed_successfully'; // default: service_started
  restart?: boolean; // default false
  required?: boolean; // default: true
};

export default DockerDependency;
