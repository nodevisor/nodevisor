import type DockerDependency from '../@types/DockerDependency';
import type DockerDependsOn from '../@types/DockerDependsOn';
import DockerClusterType from '../constants/DockerClusterType';

type DockerDepends = Record<string, DockerDependsOn> | string[];

export default function toDockerDepends(
  depends: DockerDependency[] = [],
  type: DockerClusterType = DockerClusterType.COMPOSE,
): DockerDepends {
  const result: DockerDepends = {};

  depends.forEach((depend) => {
    const { service, cluster, ...rest } = depend;

    result[service.name] = {
      condition: 'service_started',
      ...rest,
    };
  });

  if (type === DockerClusterType.SWARM) {
    // return just list of service names
    return depends.map((depend) => depend.service.name);
  }

  return result;
}
