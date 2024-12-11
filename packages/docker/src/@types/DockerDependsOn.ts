import type DockerService from '../DockerService';

// https://docs.docker.com/reference/compose-file/services/#depends_on
type DockerDependsOn = {
  condition?: 'service_started' | 'service_healthy' | 'service_completed_successfully'; // default: service_started
  restart?: boolean; // default false
  required?: boolean; // default: true
};

export default DockerDependsOn;
