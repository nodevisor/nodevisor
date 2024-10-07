import Connection from './connections/Connection';
import SSHConnection, { type SSHConnectionConfig } from './connections/SSHConnection';
import ShellConnection from './connections/ShellConnection';
import { type CommandBuilderOptions } from './commands/CommandBuilder';
import type As from './@types/As';
import Env from './Env';

export default class Nodevisor {
  static readonly local = new Nodevisor();

  readonly connection: Connection;
  readonly env: Env;

  private commandOptions: CommandBuilderOptions;

  constructor(
    connection: Connection | SSHConnectionConfig = new ShellConnection(),
    commandOptions: CommandBuilderOptions = {},
  ) {
    this.connection = connection instanceof Connection ? connection : new SSHConnection(connection);
    this.commandOptions = commandOptions;

    // clone env from command options
    this.env = new Env(commandOptions.env);

    this.$ = this.$.bind(this);
  }

  cmd() {
    return this.connection.cmd({
      ...this.commandOptions,
      env: this.env,
    });
  }

  $(strings: TemplateStringsArray, ...values: any[]) {
    return this.cmd().append(strings, ...values);
  }

  clone(options: CommandBuilderOptions = {}) {
    return new Nodevisor(this.connection, {
      ...this.commandOptions,
      // clone env from current instance
      env: this.env,
      ...options,
    });
  }

  as(user?: string | As) {
    return this.clone({ as: user });
  }

  async platform() {
    return this.cmd().platform();
  }

  async close() {
    return this.connection.close();
  }
}
