import Env from './Env';
import type Quote from './@types/Quote';
import defaultQuote from './quotes/quote';
import log from './utils/log';
import Connection from './connections/Connection';
import SSHConnection, { type SSHConnectionConfig } from './connections/SSHConnection';
import ShellConnection from './connections/ShellConnection';

const logError = log.extend('error');

export type ExecAsMethod = 'su' | 'runuser';

type Config = {
  execAs?: string;
  execAsMethod?: ExecAsMethod;
  quote?: Quote;
} & (
  | {}
  | SSHConnectionConfig
  | {
      connection: Connection;
    }
);

const DEFAULT_EXEC_AS_METHOD: ExecAsMethod = 'su';

export default class Nodevisor {
  readonly connection: Connection;

  private execAs: string | undefined;

  private execAsMethod: ExecAsMethod;

  private quote: Quote;

  private execEnv: Env;

  constructor(config: Config = {}) {
    const {
      execAs,
      execAsMethod = DEFAULT_EXEC_AS_METHOD,
      quote = defaultQuote,
      ...connectionConfig
    } = config;

    this.connection =
      'connection' in config
        ? config.connection
        : 'username' in connectionConfig
        ? new SSHConnection(connectionConfig as SSHConnectionConfig)
        : new ShellConnection(connectionConfig);

    this.execAs = execAs;
    this.execAsMethod = execAsMethod;
    this.execEnv = new Env();

    this.quote = quote;

    this.exec = this.exec.bind(this);
    this.cmd = this.cmd.bind(this);
    this.$ = this.$.bind(this);
  }

  async exec(cmd: string) {
    try {
      log(`Executing command: ${cmd}`);
      return this.connection.exec(cmd);
    } catch (error) {
      logError(`Error executing command '${cmd}':`, error);
      throw error;
    }
  }

  private applyUserSwitch(cmd: string): string {
    if (this.execAsMethod === 'su') {
      return `su - ${this.execAs} -c ${this.quote(cmd)}`;
    } else if (this.execAsMethod === 'runuser') {
      return `runuser -l ${this.execAs} -c ${this.quote(cmd)}`;
    } else {
      throw new Error(`Unsupported execAsMethod: ${this.execAsMethod}`);
    }
  }

  cmd(strings: TemplateStringsArray, ...values: any[]) {
    // Create the command string from the template literals
    let command = strings.reduce((acc, str, i) => {
      const variable = values[i] ? this.quote(values[i]) : '';
      return acc + str + variable;
    }, '');

    if (this.execAs && !this.execEnv.isEmpty()) {
      log(`Executing as ${this.execAs}`);

      const envCmd = this.execEnv.getCommand(this.quote);

      log(`Setting environment variables: ${envCmd}`);

      if (envCmd) {
        command = `${envCmd} && ${command}`;
      }
    }

    if (this.execAs) {
      command = this.applyUserSwitch(command);
    }

    return command;
  }

  async $(strings: TemplateStringsArray, ...values: any[]) {
    const cmd = this.cmd(strings, ...values);

    return this.exec(cmd);
  }

  as(execAs: string, execAsMethod: ExecAsMethod = DEFAULT_EXEC_AS_METHOD) {
    return new Nodevisor({
      connection: this.connection,
      execAs,
      execAsMethod,
    });
  }

  original() {
    return new Nodevisor({
      connection: this.connection,
    });
  }

  isOriginal() {
    return !this.execAs;
  }

  async close() {
    return this.connection.close();
  }
}
