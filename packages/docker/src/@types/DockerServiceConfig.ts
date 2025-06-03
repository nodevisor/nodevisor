import type { ClusterServiceConfig } from '@nodevisor/cluster';
import type DockerHealthcheckConfig from './DockerHealthcheckConfig';

export type DockerServiceConfig = ClusterServiceConfig & {
  healthcheck?: DockerHealthcheckConfig;
  managerOnly?: boolean;
};
