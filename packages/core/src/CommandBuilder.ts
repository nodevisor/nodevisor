import { trimEnd } from 'lodash';
import type Connection from './connections/Connection';
import type Quote from './@types/Quote';
import type RunAs from './@types/RunAs';
import Env from './Env';
import type Command from './@types/Command';
import commandToString from './utils/commandToString';
import quote from './quotes/quote';
import powerShellQuote from './quotes/powerShellQuote';

type Transform = 'sanitize' | 'trim' | 'trimEnd' | 'toLowerCase' | 'boolean' | 'lines';

export type CommandBuilderOptions = {
  runAs?: RunAs;
  env?: Env;
  transforms?: Transform[];
  quote?: Quote;
};

export default class CommandBuilder<ReturnValue = string> {
  private command: Command = [];

  private connection: Connection;
  private runAs?: RunAs;
  private transforms: Transform[];
  private env: Env;
  private quote?: Quote;

  constructor(connection: Connection, options: CommandBuilderOptions = {}) {
    const { runAs, env, transforms = ['sanitize'], quote } = options;

    this.connection = connection;
    this.runAs = runAs;
    this.transforms = transforms;
    this.quote = quote;

    this.env = new Env(env);
  }

  private async applyRunAs(cmd: string) {
    const { runAs } = this;
    if (!runAs) {
      return cmd;
    }

    const { username, method = 'su' } = runAs;

    switch (method) {
      case 'su':
        return this.connection.$`su - ${username} -c ${cmd}`.toString();
      case 'runuser':
        return this.connection.$`runuser -l ${username} -c ${cmd}`.toString();
      default:
        throw new Error(`Unsupported user switch: ${method}`);
    }
  }

  powerShellQuote() {
    this.quote = powerShellQuote;
    return this;
  }

  shellQuote() {
    this.quote = quote;
    return this;
  }

  append(strings: TemplateStringsArray, ...values: any[]) {
    this.command.push({ strings: strings, values });
    return this;
  }

  setEnv(key: string | Record<string, string>, value?: string) {
    this.env.set(key, value);
    return this;
  }

  $(strings: TemplateStringsArray, ...values: any[]) {
    return this.append(strings, ...values);
  }

  async toString() {
    const quote = this.quote || (await this.connection.getQuote());
    let command = commandToString(this.command, quote);

    if (!this.env.isEmpty()) {
      const envCmd = this.env.getCommand(quote);

      if (envCmd) {
        command = `${envCmd} && ${command}`;
      }
    }

    command = await this.applyRunAs(command);

    return command;
  }

  async applyTransforms(value: string): Promise<ReturnValue> {
    let result: any = value;

    this.transforms.forEach((transform) => {
      if (transform === 'sanitize') {
        result = result.replace(/[\r\n]+$/, '');
      } else if (transform === 'trim') {
        result = result.trim();
      } else if (transform === 'trimEnd') {
        result = trimEnd(result);
      } else if (transform === 'toLowerCase') {
        result = result.toLowerCase();
      } else if (transform === 'boolean') {
        const trueValues = ['true', 'yes', '1'];
        result = trueValues.includes(result.trim().toLowerCase());
      } else if (transform === 'lines') {
        result = result.split('\n');
      }
    });

    return result;
  }

  async exec(): Promise<ReturnValue> {
    const command = await this.toString();
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
    this.$` && `;

    return this.append(strings, ...values);
  }

  or(strings: TemplateStringsArray, ...values: any[]) {
    this.$` || `;

    return this.append(strings, ...values);
  }

  silent() {
    return this.append` > /dev/null`;
  }

  // transformation methods
  private removeTransformation(transform: Transform): this {
    const index = this.transforms.indexOf(transform);
    if (index > -1) {
      this.transforms.splice(index, 1);
    }

    return this;
  }

  private addTransformation(transform: Transform): this {
    if (!this.transforms.includes(transform)) {
      this.transforms.push(transform);
    }

    return this;
  }

  private transform(transform: Transform, enable = true): this {
    if (enable) {
      return this.addTransformation(transform);
    }

    return this.removeTransformation(transform);
  }

  // transform methods
  sanitize(enable = true): this {
    return this.transform('sanitize', enable);
  }

  trim(enable = true): this {
    return this.transform('trim', enable);
  }

  trimEnd(enable = true): this {
    return this.transform('trimEnd', enable);
  }

  toLowerCase(enable = true): this {
    return this.transform('toLowerCase', enable);
  }

  lines<TCommandBuilder extends CommandBuilder<string[]>>(enable = false): TCommandBuilder {
    this.transform('lines', enable);
    return this as unknown as TCommandBuilder;
  }

  boolean<TCommandBuilder extends CommandBuilder<boolean>>(test = false): TCommandBuilder {
    if (test) {
      this.silent().and`echo ${'true'}`.or`echo ${'false'}`;
    }

    this.transforms.push('boolean');
    return this as unknown as TCommandBuilder;
  }
}
