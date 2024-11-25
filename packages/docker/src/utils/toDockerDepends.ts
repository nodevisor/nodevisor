import Depends from '../@types/Depends';
import DockerClusterType from '../constants/DockerClusterType';

type DockerDepend = Omit<Depends, 'service'>;
type DockerDepends = Record<string, DockerDepend> | string[];

export default function toDockerDepends(
  depends: Depends[] = [],
  type: DockerClusterType = DockerClusterType.COMPOSE,
): DockerDepends {
  const result: DockerDepends = {};

  depends.forEach((depend) => {
    const { service, ...rest } = depend;

    result[service.name] = rest;
  });

  if (type === DockerClusterType.SWARM) {
    // return just list of service names
    return depends.map((depend) => depend.service.name);
  }

  return result;
}
