import ClusterServiceBase from './ClusterServiceBase';

export type ClusterBaseConfig = {
  name: string;
};

export default abstract class ClusterBase {
  readonly name: string;

  constructor(config: ClusterBaseConfig) {
    const { name } = config;

    this.name = name;
  }

  abstract getNetworkName(service: ClusterServiceBase): string;
}
