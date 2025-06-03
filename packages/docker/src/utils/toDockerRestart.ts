import { ClusterType } from '@nodevisor/cluster';
import type DockerComposeServiceConfig from '../@types/DockerComposeServiceConfig';
import type DockerService from '../DockerService';

type DockerRestart = DockerComposeServiceConfig['restart'];

// https://docs.docker.com/reference/compose-file/services/#restart
export default function toDockerRestart(service: DockerService, type: ClusterType): DockerRestart {
  if (type === ClusterType.DOCKER_SWARM) {
    throw new Error('Restart is not supported for swarm mode');
  }

  const restart = service.getRestart();

  const condition = typeof restart === 'string' ? restart : restart?.condition;
  const maxAttempts = typeof restart === 'string' ? undefined : restart?.maxAttempts;

  // unless-stopped is not supported for swarm mode - todo allow for compose ?

  switch (condition) {
    case 'on-failure':
      if (maxAttempts) {
        return `on-failure:${maxAttempts}`;
      }
      return 'on-failure';
    case 'none':
      return 'no';
    default:
      return 'always';
  }
}
