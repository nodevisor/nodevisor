import type Duration from './Duration';

type UpdateConfig = {
  parallelism?: number; // default: 1,  If set to 0, all containers rollback simultaneously.
  delay?: Duration; // The time to wait between each container group's rollback (default 0s).
  failure_action?: 'continue' | 'pause' | 'rollback'; // default: pause
  monitor?: Duration; // The time to monitor failed tasks before considering the rollback as failed (default 5m).
  max_failure_ratio?: number; // The failure rate to tolerate during a rollback (default 0).
  // Order of operations during rollbacks. One of stop-first (old task is stopped before starting new one), or start-first (new task is started first, and the running tasks briefly overlap) (default stop-first)
  order?: 'start-first' | 'stop-first'; // default: stop-first
};

export default UpdateConfig;
