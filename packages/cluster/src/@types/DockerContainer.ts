import type Port from './Port';
import type DockerDuration from './DockerDuration';

type UpdateConfig = {
  parallelism?: number; // default: 1,  If set to 0, all containers rollback simultaneously.
  delay?: DockerDuration; // The time to wait between each container group's rollback (default 0s).
  failure_action?: 'continue' | 'pause' | 'rollback'; // default: pause
  monitor?: DockerDuration; // The time to monitor failed tasks before considering the rollback as failed (default 5m).
  max_failure_ratio?: number; // The failure rate to tolerate during a rollback (default 0).
  // Order of operations during rollbacks. One of stop-first (old task is stopped before starting new one), or start-first (new task is started first, and the running tasks briefly overlap) (default stop-first)
  order?: 'start-first' | 'stop-first'; // default: stop-first
};

// https://docs.docker.com/reference/compose-file/services/#environment
type DockerContainer = {
  image?: string;
  command?: string;
  labels?: Record<string, string>;
  environment?: Record<string, string>;
  volumes?: Record<string, string>;
  networks?: string[];
  ports?: Port[];
  restart?: 'no' | 'always' | 'unless-stopped' | 'on-failure' | `on-failure:${number}`;
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
      delay?: DockerDuration; // default is 0, meaning restart attempts can occur immediately.
      max_attempts?: number; // default: never give up
      window?: DockerDuration; // default: decide immediately
    };
    // https://docs.docker.com/reference/compose-file/deploy/#rollback_config
    // configures how the service should be rollbacked in case of a failing update.
    rollback_config?: UpdateConfig;
    // configures how the service should be updated. Useful for configuring rolling updates.
    update_config?: UpdateConfig;
  };
};

export default DockerContainer;
