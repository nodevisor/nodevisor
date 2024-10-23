import PartialFor from '../@types/PartialFor';
import ClusterService, { type ClusterServiceConfig } from '../ClusterService';

type MaxmemoryPolicy =
  | 'noeviction'
  | 'allkeys-lru'
  | 'allkeys-random'
  | 'volatile-lru'
  | 'volatile-random'
  | 'volatile-ttl';

type RedisConfig = PartialFor<ClusterServiceConfig, 'name' | 'image'> & {
  password?: string;
  appendonly?: boolean;
  maxmemoryPolicy?: MaxmemoryPolicy;
};

export default class Redis extends ClusterService {
  private password?: string;
  private appendonly?: boolean;
  private maxmemoryPolicy?: MaxmemoryPolicy;

  constructor(config: RedisConfig) {
    const { password, appendonly, maxmemoryPolicy, ...rest } = config;

    super({
      restart: 'unless-stopped',
      name: 'redis',
      image: 'redis:7.0-alpine',
      ...rest,
    });

    this.password = password;
    this.appendonly = appendonly;
    this.maxmemoryPolicy = maxmemoryPolicy;
  }

  getDockerConfig() {
    const { password, appendonly, maxmemoryPolicy } = this;

    const { environment = {}, volumes = {}, ...rest } = super.getDockerConfig();

    if (password) {
      environment.REDIS_PASSWORD = password;
    }

    if (!volumes.redis_data) {
      volumes.redis_data = '/data';
    }

    const command = [
      'redis-server',
      appendonly ? '--appendonly yes' : '',
      // password ? `--requirepass ${password}` : '',
      maxmemoryPolicy ? `--maxmemory-policy ${maxmemoryPolicy}` : '',
    ].join(' ');

    return {
      // command,
      volumes,
      environment,
      ...rest,
    };
  }
}
