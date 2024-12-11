import { type ClusterBase, type ClusterServiceBase } from '@nodevisor/cluster';
import type ServiceVolume from '../@types/ServiceVolume';
import type DockerVolume from '../@types/DockerVolume';

export default function toDockerVolumes(
  cluster: ClusterBase,
  service: ClusterServiceBase,
  volumes: ServiceVolume[],
): DockerVolume[] {
  return volumes.map((volume) => {
    const { name, topLevel, source, type, ...rest } = volume;

    const uniqueName = cluster.getVolumeName(service, volume);

    let computedSource: string | undefined = source ?? uniqueName;

    if (type === 'tmpfs') {
      computedSource = undefined;
    }

    return {
      type,
      source: computedSource,
      ...rest,
    } as DockerVolume;
  });
}
