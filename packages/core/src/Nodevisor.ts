import Env from './Env';
import Connection from './connections/Connection';
import SSHConnection, { type SSHConnectionConfig } from './connections/SSHConnection';
import ShellConnection, { type ShellConnectionConfig } from './connections/ShellConnection';
import CommandBuilder, { type CommandBuilderOptions } from './CommandBuilder';
import type RunAs from './@types/RunAs';

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

  private env: Env;

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

  cmd(options: CommandBuilderOptions = {}): CommandBuilder {
    return new CommandBuilder(this.connection, {
      runAs: this.runAs,
      env: this.env,
      ...options,
    });
  }

  $(strings: TemplateStringsArray, ...values: any[]): CommandBuilder {
    return this.cmd().$(strings, ...values);
  }

  as(runAs: RunAs) {
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
