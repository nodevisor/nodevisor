import { type PartialFor } from '@nodevisor/cluster';
import DockerService, { type DockerServiceConfig } from '../DockerService';
import type DockerVolume from '../@types/DockerVolume';
import type PortService from './PortService';

type PostgresConfig = PartialFor<DockerServiceConfig, 'name'> & {
  port?: number;
  password?: string;
  username?: string;
  database?: string;
  version?: string;
  volume?: DockerVolume;
};

export default class Postgres extends DockerService implements PortService {
  readonly port: number;
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
      restart = 'unless-stopped',
      version = '17.5',
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

    this.port = port;
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
