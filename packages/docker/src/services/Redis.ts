import { type PartialFor } from '@nodevisor/cluster';
import DockerService, { type DockerServiceConfig } from '../DockerService';
import type DockerVolume from '../@types/DockerVolume';

import PortDockerService, { type PortDockerServiceConfig } from './PortDockerService';

type MaxmemoryPolicy =
  | 'noeviction'
  | 'allkeys-lru'
  | 'allkeys-random'
  | 'volatile-lru'
  | 'volatile-random'
  | 'volatile-ttl';

type RedisConfig = PartialFor<PortDockerServiceConfig, 'name'> & {
  port?: number;
  password?: string;
  appendonly?: boolean;
  maxmemory?: string | number;
  maxmemoryPolicy?: MaxmemoryPolicy;
  volume?: DockerVolume;
  version?: string;
};

export default class Redis extends PortDockerService {
  private password?: string;
  private appendonly?: boolean;
  private maxmemory?: string | number;
  private maxmemoryPolicy?: MaxmemoryPolicy;

  private volume?: DockerVolume;

  constructor(config: RedisConfig = {}) {
    const {
      port = 6379,
      password,
      appendonly,
      maxmemory,
      maxmemoryPolicy,
      volume,
      name = 'redis',
      version = '8.0.2',
      image = `redis:${version}`,
      ...rest
    } = config;

    super({
      port,
      name,
      image,
      ...rest,
    });

    this.password = password;
    this.appendonly = appendonly;
    this.maxmemory = maxmemory;
    this.maxmemoryPolicy = maxmemoryPolicy;
    this.volume = volume;

    if (!rest.healthcheck) {
      this.healthcheck.set`redis-cli ping | grep PONG`;
      this.healthcheck.interval = '10s';
      this.healthcheck.timeout = '2s';
      this.healthcheck.retries = 3;
      this.healthcheck.startPeriod = '5s';
    }
  }

  getVolumes() {
    const volumes = super.getVolumes();

    volumes.push({
      name: 'data',
      target: '/data',
      type: 'volume',
    });

    return volumes;
  }

  getEnvironments() {
    const environments = super.getEnvironments();

    const { password } = this;

    if (password) {
      environments.REDIS_PASSWORD = password;
    }

    return environments;
  }

  getCommand() {
    const command = super.getCommand();

    const { appendonly, maxmemory, maxmemoryPolicy } = this;

    command.append`redis-server`;

    if (appendonly) {
      command.argument('--appendonly', true);
    }

    if (maxmemoryPolicy) {
      command.argument('--maxmemory-policy', maxmemoryPolicy);
    }

    if (maxmemory) {
      const maxmemoryValue = typeof maxmemory === 'number' ? `${maxmemory}mb` : maxmemory;

      command.argument('--maxmemory', maxmemoryValue);
    }

    return command;
  }
}

/*
healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3
      */
