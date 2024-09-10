import { trimEnd } from 'lodash';
import type Connection from './connections/Connection';
import type QuoteArg from './@types/QuoteArg';
import type { Raw } from './utils/raw';
import type RunAs from './@types/RunAs';
import Env from './Env';

type Transform = 'sanitize' | 'trim' | 'trimEnd' | 'toLowerCase' | 'boolean';

export type CommandBuilderOptions = {
  runAs?: RunAs;
  env?: Env;
  transforms?: Transform[];
};

export default class CommandBuilder<ReturnValue = string> {
  private connection: Connection;
  private command = '';
  private runAs?: RunAs;
  private env: Env;

  private transforms: Transform[] = ['sanitize'];


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

  async applyTransforms(value: string): Promise<ReturnValue> {
    let result: any = value;

    this.transforms.forEach((transform) => {
      if (transform === 'trim') {
        result = result.trim();
      } else if (transform === 'trimEnd') {
        result = trimEnd(result);
      } else if (transform === 'toLowerCase') {
        result = result.toLowerCase();
      } else if (transform === 'boolean') {
        const trueValues = ['true', 'yes', '1'];
        result = trueValues.includes(result.trim().toLowerCase());
      } else if (transform === 'sanitize') {
        result = result.replace(/[\r\n]+$/, '');
      }
    }); 

    return result;
  }

  async exec(): Promise<ReturnValue> {
    const command = this.buildCommand();
    const result = await this.connection.exec(command);
    return this.applyTransforms(result);
  }

  async then(resolve: (value: ReturnValue) => void, reject: (reason?: Error) => void) {
    try {
      resolve(await this.exec());
    } catch (error) {
      reject(error as Error);
    }
  }

  // logical operators
  and(strings: TemplateStringsArray, ...values: any[]) {
    this.command += ' && ';
    
    return this.append(strings, ...values);
  }

  or(strings: TemplateStringsArray, ...values: any[]) {
    this.command += ' || ';
    
    return this.append(strings, ...values);
  }

  // transform methods
  sanitize(enable = true): this {
    this.transforms.push('sanitize');
    return this;
  }

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

  boolean<TCommandBuilder extends CommandBuilder<boolean>>(test = false): TCommandBuilder {
    if (test) {
      this.and`echo ${'true'}`.or`echo ${'false'}`;
    }

    this.transforms.push('boolean');
    return this as unknown as TCommandBuilder;
  }

  toString() {
    return this.buildCommand();
  }
}