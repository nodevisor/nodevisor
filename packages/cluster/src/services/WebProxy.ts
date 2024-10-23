import ClusterService, { type ClusterServiceConfig } from '../ClusterService';
import type Web from './Web';
import type Labels from '../@types/Labels';

export type WebProxyConfig = ClusterServiceConfig & {};

export default abstract class WebProxy extends ClusterService {
  abstract getWebLabels(web: Web): Labels;
}
