import { set } from 'lodash';
import { type ClusterBase, type Labels } from '@nodevisor/cluster';
import DockerService, { type DockerServiceConfig } from '../DockerService';
import type Web from './Web';

export type WebProxyConfig = DockerServiceConfig & {};

export default abstract class WebProxy extends DockerService {
  abstract getWebLabels(proxyCluster: ClusterBase, web: Web): Labels;

  constructor(config: DockerServiceConfig) {
    super({
      ...config,
    });
  }

  getDeploy() {
    const deploy = super.getDeploy();

    // place web proxy on manager node
    set(deploy, 'placement.constraints', ['node.role == manager']);

    // run on all nodes (limited by placement constraints), if multiple managers are present all of them will run the proxy
    set(deploy, 'mode', 'global');

    return deploy;
  }
}
