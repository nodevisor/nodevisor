import type Duration from './Duration';

// https://docs.docker.com/reference/dockerfile/#healthcheck
// https://www.australtech.net/docker-healthcheck-instruction/
type DockerHealthcheckConfig = {
  test?: string;
  // Sets the amount of time to wait before performing the healthcheck command. Healhcheck always runs a command once the container starts up.
  interval?: Duration; // default 30s, 1m30s
  // 	Defines a time limit for evaluating the healthcheck command.
  timeout?: Duration; // default 30s
  // Sets the number of times a healthcheck will be run after an unsuccessful attempt to set the container to unhealthy.
  retries?: number; // default 3
  // Defines a time frame in which to start the healthcheck process, which is essential when you have a delayed application, such as Monolithic web applications.
  start_period?: Duration; // default 0s, 40s
  start_interval?: Duration; // default 0s, 5s
  disable?: boolean;
};

export default DockerHealthcheckConfig;
