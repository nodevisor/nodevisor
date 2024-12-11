import { type PartialFor } from '@nodevisor/cluster';
import DockerService, { type DockerServiceConfig } from '../DockerService';
import type DockerVolume from '../@types/DockerVolume';

type MaxmemoryPolicy =
  | 'noeviction'
  | 'allkeys-lru'
  | 'allkeys-random'
  | 'volatile-lru'
  | 'volatile-random'
  | 'volatile-ttl';

type RedisConfig = PartialFor<DockerServiceConfig, 'name'> & {
  password?: string;
  appendonly?: boolean;
  maxmemory?: string | number;
  maxmemoryPolicy?: MaxmemoryPolicy;
  volume?: DockerVolume;
  version?: string;
};

export default class Redis extends DockerService {
  private password?: string;
  private appendonly?: boolean;
  private maxmemory?: string | number;
  private maxmemoryPolicy?: MaxmemoryPolicy;

  private volume?: DockerVolume;

  constructor(config: RedisConfig = {}) {
    const {
      password,
      appendonly,
      maxmemory,
      maxmemoryPolicy,
      volume,
      restart = 'unless-stopped',
      name = 'redis',
      version = '7.4.1',
      image = `redis:${version}`,
      ...rest
    } = config;

    super({
      name,
      image,
      restart,
      ...rest,
    });

    this.password = password;
    this.appendonly = appendonly;
    this.maxmemory = maxmemory;
    this.maxmemoryPolicy = maxmemoryPolicy;
    this.volume = volume;
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
