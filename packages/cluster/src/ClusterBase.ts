import ClusterServiceBase from './ClusterServiceBase';
import type Volume from './@types/Volume';

export type ClusterBaseConfig = {
  name: string;
};

export default abstract class ClusterBase {
  readonly name: string;

  constructor(config: ClusterBaseConfig) {
    const { name } = config;

    this.name = name;
  }

  getNetworkName(service: ClusterServiceBase) {
    const clusterName = this.name;

    return `${clusterName}_${service.name}_network`;
  }

  getVolumeName(service: ClusterServiceBase, volume: Volume): string {
    const clusterName = this.name;

    // source is not required for tmpfs volumes but we will remove it later
    // so we need to keep it for now

    return `${clusterName}_${service.name}_${volume.name}_volume`;
  }
}
