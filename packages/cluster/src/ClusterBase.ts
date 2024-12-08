import ClusterServiceBase from './ClusterServiceBase';
import { ServiceScope } from './constants';

export type ClusterBaseConfig = {
  name: string;
  externalName?: string;
};

export default abstract class ClusterBase {
  readonly name: string;
  readonly externalName: string;

  constructor(config: ClusterBaseConfig) {
    const { name, externalName = 'nodevisor' } = config;

    this.name = name;
    this.externalName = externalName;
  }

  abstract getServices(scope: ServiceScope, includeDepends: boolean): ClusterServiceBase[];

  abstract getNetworkName(service: ClusterServiceBase, scope?: ServiceScope): string;
}
