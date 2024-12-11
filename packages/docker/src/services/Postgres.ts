import { type PartialFor } from '@nodevisor/cluster';
import DockerService, { type DockerServiceConfig } from '../DockerService';
import type DockerVolume from '../@types/DockerVolume';

type PostgresConfig = PartialFor<DockerServiceConfig, 'name'> & {
  password?: string;
  username?: string;
  database?: string;
  version?: string;
  volume?: DockerVolume;
};

export default class Postgres extends DockerService {
  private password?: string;
  private username?: string;
  private database?: string;
  private volume?: DockerVolume;

  constructor(config: PostgresConfig = {}) {
    const {
      password,
      username,
      database,
      volume,
      restart = 'unless-stopped',
      version = '15',
      name = 'postgres',
      image = `postgres:${version}`,
      ...rest
    } = config;

    super({
      name,
      image,
      restart,
      ...rest,
    });

    this.password = password;
    this.username = username;
    this.database = database;
    this.volume = volume;
  }

  getVolumes() {
    const volumes = super.getVolumes();

    volumes.push({
      name: 'data',
      target: '/var/lib/postgresql/data',
      type: 'volume',
    });

    return volumes;
  }

  getEnvironments() {
    const environments = super.getEnvironments();

    const { password, username, database } = this;

    if (password) {
      environments.POSTGRES_PASSWORD = password;
    }

    if (username) {
      environments.POSTGRES_USER = username;
    }

    if (database) {
      environments.POSTGRES_DB = database;
    }

    return environments;
  }
}
