import Connection from './connections/Connection';
import SSHConnection, { type SSHConnectionConfig } from './connections/SSHConnection';
import ShellConnection, { type ShellConnectionConfig } from './connections/ShellConnection';
import CommandBuilder, { type CommandBuilderOptions } from './commands/CommandBuilder';
import type RunAs from './@types/RunAs';
import Env from './envs/Env';

type Config = {
  runAs?: RunAs;
  env?: Env;
} & (
  | {}
  | SSHConnectionConfig
  | {
      connection: Connection;
    }
);

export default class Nodevisor {
  readonly connection: Connection;

  readonly env: Env;

  private runAs?: RunAs;

  constructor(config: Config = {}) {
    const { runAs, env, ...connectionConfig } = config;

    this.connection =
      'connection' in config
        ? config.connection
        : 'username' in connectionConfig
          ? new SSHConnection(connectionConfig as SSHConnectionConfig)
          : new ShellConnection(connectionConfig as ShellConnectionConfig);

    this.env = new Env(env);
    this.runAs = runAs;

    this.cmd = this.cmd.bind(this);
    this.$ = this.$.bind(this);
  }

  cmd(options: Omit<CommandBuilderOptions, 'env'> = {}): CommandBuilder {
    return this.connection.cmd({
      runAs: this.runAs,
      env: new Env(this.env),
      ...options,
    });
  }

  $(strings: TemplateStringsArray, ...values: any[]): CommandBuilder {
    return this.cmd().append(strings, ...values);
  }

  as(runAs: RunAs | string) {
    if (typeof runAs === 'string') {
      return new Nodevisor({
        connection: this.connection,
        env: this.env,
        runAs: {
          username: runAs,
        },
      });
    }

    return new Nodevisor({
      connection: this.connection,
      env: this.env,
      runAs,
    });
  }

  async close() {
    return this.connection.close();
  }
}
