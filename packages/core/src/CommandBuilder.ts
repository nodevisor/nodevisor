import { trimEnd } from 'lodash';
import type Connection from './connections/Connection';
import type QuoteArg from './@types/QuoteArg';
import type { Raw } from './utils/raw';
import type RunAs from './@types/RunAs';
import Env from './Env';

export type CommandBuilderOptions = {
  runAs?: RunAs;
  env?: Env;
};

export default class CommandBuilder {
  private connection: Connection;
  private command = '';
  private runAs?: RunAs;
  private env: Env;

  constructor(connection: Connection, options: CommandBuilderOptions = {}) {
    const { runAs, env } = options;

    this.connection = connection;
    this.runAs = runAs;

    this.env = new Env(env);
  }

  private exec(cmd: string) {
    return this.connection.exec(cmd);
  }

  private quote(value: QuoteArg | QuoteArg[]): string | Raw {
    return this.connection.quote(value);
  }

  private applyRunAs(cmd: string): string {
    const { runAs } = this;
    if (!runAs) return cmd;

    const { username, method = 'su' } = runAs;
    if (method === 'su') {
      return `su - ${username} -c ${this.quote(cmd)}`;
    } else if (method === 'runuser') {
      return `runuser -l ${username} -c ${this.quote(cmd)}`;
    }
      
    throw new Error(`Unsupported user switch: ${method}`);
  }

  append(strings: TemplateStringsArray, ...values: any[]): this {
    const builtCmd = strings.reduce((acc, str, i) => {
      const variable = values[i] ? this.quote(values[i]) : '';
      return acc + str + variable;
    }, '');

    this.command += builtCmd;
  
    return this;
  }

  setEnv(key: string | Record<string, string>, value?: string): this {
    this.env.set(key, value);
    return this;
  }

  $(strings: TemplateStringsArray, ...values: any[]) {
    return this.append(strings, ...values);
  }

  private buildCommand() {
    let { command } = this;

    if (!this.env.isEmpty()) {
      const envCmd = this.env.getCommand(this.quote);

      if(envCmd) {
        command = `${envCmd} && ${command}`;
      }
    }

    command = this.applyRunAs(command);

    return command;
  }

  async then(resolve: (value: string) => void, reject: (reason?: Error) => void) {
    try {
      const command = this.buildCommand();

      let result = await this.exec(command);

      result = trimEnd(result, '\n');

      resolve(result);
    } catch (error) {
      reject(error as Error);
    }
  }

  toString() {
    return this.buildCommand();
  }
}