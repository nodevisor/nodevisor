import Connection from './connections/Connection';
import SSHConnection, { type SSHConnectionConfig } from './connections/SSHConnection';
import ShellConnection from './connections/ShellConnection';
import CommandBuilder, { type CommandBuilderOptions } from './commands/CommandBuilder';
import type As from './@types/As';

export default class Nodevisor {
  static readonly local = new Nodevisor();

  readonly connection: Connection;

  private commandOptions: CommandBuilderOptions;

  constructor(
    connection: Connection | SSHConnectionConfig = new ShellConnection(),
    commandOptions: CommandBuilderOptions = {},
  ) {
    this.connection = connection instanceof Connection ? connection : new SSHConnection(connection);
    this.commandOptions = commandOptions;

    this.$ = this.$.bind(this);
  }

  $(strings: TemplateStringsArray, ...values: any[]) {
    return new CommandBuilder(this.connection, this.commandOptions).append(strings, ...values);
  }

  clone(options: CommandBuilderOptions = {}) {
    return new Nodevisor(this.connection, {
      ...this.commandOptions,
      ...options,
    });
  }

  as(user?: string | As) {
    return this.clone({ as: user });
  }

  async platform() {
    return this.$``.platform();
  }

  async close() {
    return this.connection.close();
  }
}
