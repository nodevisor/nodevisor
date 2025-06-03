import { ClusterType, Mode, PlacementType } from '@nodevisor/cluster';
import type DockerComposeServiceConfig from '../@types/DockerComposeServiceConfig';
import type DockerService from '../DockerService';
import Constraints from '../constants/Constraints';

type Deploy = DockerComposeServiceConfig['deploy'];

// https://docs.docker.com/reference/compose-file/services/#restart
export default function toDockerDeploy(service: DockerService, type: ClusterType): Deploy {
  const cpus = service.getCpus();
  const memory = service.getMemory();

  const deploy: DockerComposeServiceConfig['deploy'] = {
    resources: {
      limits: {
        cpus: cpus.max.toString(),
        memory: memory.max,
      },
      reservations: {
        cpus: cpus.min.toString(),
        memory: memory.min,
      },
    },
  };

  if (type === ClusterType.DOCKER_COMPOSE) {
    // another properties are not supported
    return deploy;
  }

  // prepare restart policy
  const restart = service.getRestart();
  const restartCondition = typeof restart === 'string' ? restart : restart?.condition;

  if (restartCondition) {
    deploy.restart_policy = {
      condition: restartCondition,
      ...(typeof restart === 'string' ? {} : restart),
    };
  }

  // prepare mode
  const mode = service.getMode();
  if (mode === Mode.GLOBAL) {
    deploy.mode = 'global';
  }

  // prepare placement
  const placement = service.getPlacement();
  if (placement) {
    deploy.placement = {
      ...deploy.placement,
    };

    const constraints = deploy.placement.constraints ?? [];

    const placementType = typeof placement === 'string' ? placement : placement.type;
    if (placementType === PlacementType.MANAGER) {
      constraints.push(Constraints.NODE_ROLE_MANAGER);
    } else if (placementType === PlacementType.WORKER) {
      constraints.push(Constraints.NODE_ROLE_WORKER);
    } else if (
      placementType === PlacementType.CONSTRAINTS &&
      typeof placement === 'object' &&
      'constraints' in placement
    ) {
      constraints.push(...(placement.constraints ?? []));
    }

    if (constraints.length) {
      deploy.placement.constraints = constraints;
    }
  }

  // do not set replicas for global mode because it will not run on all workers
  if (mode !== Mode.GLOBAL) {
    const replicas = service.getReplicas();
    if (replicas.min) {
      deploy.replicas = replicas.min;
    }
  }
}
