import { Mode, PlacementType, type ClusterBase, type Labels } from '@nodevisor/cluster';
import DockerService, { type DockerServiceConfig } from '../DockerService';
import type Web from './Web';

export type WebProxyConfig = DockerServiceConfig & {};

export default abstract class WebProxy extends DockerService {
  abstract getWebLabels(proxyCluster: ClusterBase, web: Web): Labels;

  constructor(config: DockerServiceConfig) {
    super({
      mode: Mode.GLOBAL,
      placement: PlacementType.MANAGER,
      ...config,
    });
  }
}
