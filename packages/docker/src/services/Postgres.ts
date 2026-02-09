import { type PartialFor } from '@nodevisor/cluster';
import type DockerVolume from '../@types/DockerVolume';
import PortDockerService, { type PortDockerServiceConfig } from './PortDockerService';

export type PostgresConfig = PartialFor<PortDockerServiceConfig, 'name'> & {
  port?: number;
  password?: string;
  username?: string;
  database?: string;
  version?: string;
  volume?: DockerVolume;
};

export default class Postgres extends PortDockerService {
  private password?: string;
  private username?: string;
  private database?: string;
  private volume?: DockerVolume;

  constructor(config: PostgresConfig = {}) {
    const {
      port = 5432,
      password,
      username,
      database,
      volume,
      version = '17.5',
      name = 'postgres',
      image = `postgres:${version}`,
      ...rest
    } = config;

    super({
      port,
      name,
      image,
      ...rest,
    });

    this.password = password;
    this.username = username;
    this.database = database;
    this.volume = volume;

    if (!rest.healthcheck) {
      this.healthcheck.set`pg_isready -U postgres`;
      this.healthcheck.interval = '10s';
      this.healthcheck.timeout = '5s';
      this.healthcheck.retries = 5;
      this.healthcheck.startPeriod = '15s'; // 30 seconds
    }
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

    const { password, username, database, port } = this;

    if (password) {
      environments.POSTGRES_PASSWORD = password;
    }

    if (username) {
      environments.POSTGRES_USER = username;
    }

    if (database) {
      environments.POSTGRES_DB = database;
    }

    environments.POSTGRES_PORT = port.toString();

    return environments;
  }
}
