import { type Port } from '@nodevisor/cluster';
import type Duration from './Duration';
import type DockerUpdateConfig from './DockerUpdateConfig';
import type DockerVolume from './DockerVolume';
import type DockerNetwork from './DockerNetwork';
import type DockerDependsOn from './DockerDependsOn';
import type DockerHealthcheckConfig from './DockerHealthcheckConfig';

// https://docs.docker.com/reference/compose-file/services/
type DockerComposeServiceConfig = {
  image?: string;
  // compose does not scale a service beyond one container if the Compose file specifies a container_name. Attempting to do so results in an error.
  // container_name?: string; // never use it
  command?: string;
  labels?: Record<string, string>;
  environment?: Record<string, string>;
  volumes?: DockerVolume[];
  networks?: Record<string, DockerNetwork>;
  ports?: Port[];
  restart?: 'no' | 'always' | 'unless-stopped' | 'on-failure' | `on-failure:${number}`;
  depends_on?: Record<string, Omit<DockerDependsOn, 'service'>> | string[]; // swarm has list only
  healthcheck?: DockerHealthcheckConfig;
  deploy?: {
    mode?: 'global' | 'replicated';
    replicas?: number;
    placement?: {
      constraints?: string[];
    };
    resources?: {
      limits?: {
        cpus?: string;
        memory?: string;
        pids?: number;
      };
      reservations?: {
        cpus?: string;
        memory?: string;
      };
    };
    // https://docs.docker.com/reference/compose-file/deploy/#restart_policy
    restart_policy?: {
      condition?: 'none' | 'on-failure' | 'any'; // default 'any'
      delay?: Duration; // default is 0, meaning restart attempts can occur immediately.
      max_attempts?: number; // default: never give up
      window?: Duration; // default: decide immediately
    };
    // https://docs.docker.com/reference/compose-file/deploy/#rollback_config
    // configures how the service should be rollbacked in case of a failing update.
    rollback_config?: DockerUpdateConfig;
    // configures how the service should be updated. Useful for configuring rolling updates.
    update_config?: DockerUpdateConfig;
  };
};

export default DockerComposeServiceConfig;
