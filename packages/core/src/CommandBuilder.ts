import { trimEnd } from 'lodash';
import type Connection from './connections/Connection';
import type QuoteArg from './@types/QuoteArg';
import type { Raw } from './utils/raw';
import type RunAs from './@types/RunAs';
import Env from './Env';

type Transform = 'trim' | 'trimEnd' | 'toLowerCase';

export type CommandBuilderOptions = {
  runAs?: RunAs;
  env?: Env;
  transforms?: Transform[];
};

export default class CommandBuilder {
  private connection: Connection;
  private command = '';
  private runAs?: RunAs;
  private env: Env;

  private transforms: Transform[] = [];


  constructor(connection: Connection, options: CommandBuilderOptions = {}) {
    const { runAs, env } = options;

    this.connection = connection;
    this.runAs = runAs;

    this.env = new Env(env);
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

  async applyTransforms(value: string) {
    let result = value;

    this.transforms.forEach((transform) => {
      if (transform === 'trim') {
        result = result.trim();
      } else if (transform === 'trimEnd') {
        result = trimEnd(result);
      } else if (transform === 'toLowerCase') {
        result = result.toLowerCase();
      }
    });  

    return result;
  }

  async exec(): Promise<string> {
    const command = this.buildCommand();
    const result = await this.connection.exec(command);
    return this.applyTransforms(result);
  }

  async then(resolve: (value: string) => void, reject: (reason?: Error) => void) {
    try {
      resolve(await this.exec());
    } catch (error) {
      reject(error as Error);
    }
  }

  // transform methods
  trim(): this {
    this.transforms.push('trim');
    return this;
  }

  trimEnd(): this {
    this.transforms.push('trimEnd');
    return this;
  }

  toLowerCase(): this {
    this.transforms.push('toLowerCase');
    return this;
  }

  toString() {
    return this.buildCommand();
  }
}