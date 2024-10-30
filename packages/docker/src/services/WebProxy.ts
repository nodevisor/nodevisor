import { set } from 'lodash';
import { type Labels } from '@nodevisor/cluster';
import DockerService, { type DockerServiceConfig } from '../DockerService';
import type Web from './Web';

export type WebProxyConfig = DockerServiceConfig & {};

export default abstract class WebProxy extends DockerService {
  abstract getWebLabels(web: Web): Labels;

  getDeploy() {
    const deploy = super.getDeploy();

    set(deploy, 'placement.constraints', ['node.role == manager']);

    return deploy;
  }
}
