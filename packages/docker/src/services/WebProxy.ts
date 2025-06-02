import { type ClusterBase, type Labels } from '@nodevisor/cluster';
import DockerService, { type DockerServiceConfig } from '../DockerService';
import type Web from './Web';
import Constraints from '../constants/Constraints';

export type WebProxyConfig = DockerServiceConfig & {};

export default abstract class WebProxy extends DockerService {
  abstract getWebLabels(proxyCluster: ClusterBase, web: Web): Labels;

  constructor(config: DockerServiceConfig) {
    const deploy = config.deploy ?? {};
    const {
      mode = 'global',
      placement,
      ...restDeploy
    } = deploy as DockerComposeServiceConfig['deploy'];
    const { constraints = [], ...restPlacement } = placement;

    // todo add runOnManager field into config instead of strings
    if (!constraints.includes(Constraints.NODE_ROLE_MANAGER)) {
      constraints.push(Constraints.NODE_ROLE_MANAGER);
    }

    super({
      ...config,
      deploy: {
        ...restDeploy,
        mode,
        placement: {
          ...restPlacement,
          constraints,
        },
      },
    });
  }
}
