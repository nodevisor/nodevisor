import { trimEnd, cloneDeep } from 'lodash';
import type As from '../@types/As';
import Env from '../Env';
import Platform from '../constants/Platform';
import type Connection from '../connections/Connection';
import type Quote from '../@types/Quote';
import type Command from '../@types/Command';
import commandToString from '../utils/commandToString';
import quote from '../quotes/quote';
import powerShellQuote from '../quotes/powerShellQuote';
import CommandBuilderTransform from './CommandBuilderTransform';
import raw from '../utils/raw';

type Transform = 'sanitize' | 'trim' | 'trimEnd' | 'toLowerCase' | 'boolean' | 'lines';
const platforms = Object.values(Platform) as string[];

export type CommandBuilderOptions = {
  command?: Command;
  transforms?: Transform[];
  quote?: Quote;
  noThrow?: boolean;
  env?: Env | Record<string, string>;
  as?: As | string;
};

export default class CommandBuilder implements PromiseLike<string> {
  readonly connection: Connection;

  private command: Command;
  private quote?: Quote;
  private shell?: string;
  private prefix: string = '';
  private suffix: string = '';
  private transforms: Transform[];
  private env: Env;
  private as?: As;

  #noThrow: boolean;

  constructor(connection: Connection, options: CommandBuilderOptions = {}) {
    const { command = [], transforms = ['sanitize'], quote, noThrow = false, env, as } = options;

    this.connection = connection;

    this.command = cloneDeep(command);
    this.quote = quote;

    this.transforms = cloneDeep(transforms);
    this.#noThrow = noThrow;
    this.env = new Env(env);
    this.as = typeof as === 'string' ? { user: as } : as;
  }

  // quote methods
  getQuote() {
    return this.quote;
  }

  setQuote(quote: Quote) {
    this.quote = quote;
    return this;
  }

  setPowerShellQuote() {
    return this.setQuote(powerShellQuote);
  }

  setShellQuote() {
    return this.setQuote(quote);
  }

  // shell methods
  setShell(shell: string) {
    this.shell = shell;
    return this;
  }

  getShell() {
    return this.shell;
  }

  setPrefix(prefix: string) {
    this.prefix = prefix;
    return this;
  }

  getPrefix() {
    return this.prefix;
  }

  setSuffix(suffix: string) {
    this.suffix = suffix;
    return this;
  }

  getSuffix() {
    return this.suffix;
  }

  // command methods
  append(strings: TemplateStringsArray, ...values: any[]) {
    this.command.push({ strings: strings, values });
    return this;
  }

  prepend(strings: TemplateStringsArray, ...values: any[]) {
    this.command.unshift({ strings: strings, values });
    return this;
  }

  toString() {
    const { quote, shell } = this;
    if (!quote) {
      throw new Error('Quote is not set');
    }

    const cloned = this.clone().clear();

    // add env variables
    const envVariables = this.env.toObject();
    Object.keys(envVariables).forEach((key) => {
      const value = envVariables[key];
      if (value === undefined) {
        return;
      }

      cloned.and`export ${key}=${value}`;
    });

    // add env files
    const envFiles = this.env.getFiles();
    if (envFiles.length) {
      cloned.and`set -a`;
      envFiles.forEach((file) => {
        cloned.and`source ${file}`;
      });
      cloned.and`set +a`;
    }

    cloned.merge(this);

    let cmd = commandToString(cloned.command, quote);

    if (this.as) {
      cmd = this.applyAs(cmd);
    }

    if (this.shell) {
      cmd = this.applyShell(cmd);
    }

    return cmd;
  }

  // output transformation methods
  async applyTransforms(value: string) {
    let result: any = value;

    for (const transform of this.transforms) {
      switch (transform) {
        case 'sanitize':
          result = result.replace(/[\r\n]+$/, '');
          break;
        case 'trim':
          result = result.trim();
          break;
        case 'trimEnd':
          result = trimEnd(result);
          break;
        case 'toLowerCase':
          result = result.toLowerCase();
          break;
        case 'boolean':
          const trueValues = ['true', 'yes', '1'];
          result = trueValues.includes(result.trim().toLowerCase());
          break;
        case 'lines':
          if (result.trim() === '') {
            result = [];
          } else {
            result = result.split('\n');
          }
          break;
        default:
          throw new Error(`Unknown transform: ${transform}`);
      }
    }

    return result;
  }

  private applyAs(cmd: string): string {
    if (!this.as) {
      return cmd;
    }

    const { user, method = 'su' } = this.as;

    switch (method) {
      case 'su':
        return this.$`su - ${user} -c ${cmd}`.toString();
      case 'runuser':
        return this.$`runuser -l ${user} -c ${cmd}`.toString();
      default:
        throw new Error(`Unsupported user switch: ${method}`);
    }
  }

  private applyShell(cmd: string): string {
    if (!this.prefix) {
      return cmd;
    }

    return `${this.prefix}${cmd}${this.suffix}`;
  }

  // execution methods
  async exec(): Promise<string> {
    if (this.quote) {
      const command = this.toString();
      try {
        const result = await this.connection.exec(command);
        return this.applyTransforms(result);
      } catch (error) {
        if (this.#noThrow) {
          const result = (error as Error).message;
          return this.applyTransforms(result);
        }

        throw error;
      }
    }

    switch (await this.platform()) {
      case Platform.WINDOWS:
        return this.clone().setPowerShellQuote().setPrefix('pwsh -Command "').setSuffix('"').exec();
      default:
        return this.clone().setShellQuote().exec();
    }
  }

  then<TResult1, TResult2 = never>(
    onfulfilled?: ((value: string) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
  ): Promise<TResult1 | TResult2> {
    return this.exec().then(onfulfilled, onrejected);
  }

  // logical operators
  and(strings: TemplateStringsArray, ...values: any[]) {
    this.append` && `;

    return this.append(strings, ...values);
  }

  or(strings: TemplateStringsArray, ...values: any[]) {
    this.append` || `;

    return this.append(strings, ...values);
  }

  andPrepend(strings: TemplateStringsArray, ...values: any[]) {
    this.prepend` && `;

    return this.prepend(strings, ...values);
  }

  orPrepend(strings: TemplateStringsArray, ...values: any[]) {
    this.prepend` || `;

    return this.prepend(strings, ...values);
  }

  merge(commandBuilder: CommandBuilder) {
    if (!(commandBuilder instanceof CommandBuilder)) {
      throw new Error('Can only concat with another CommandBuilder instance');
    }

    this.command = cloneDeep(this.command.concat(commandBuilder.command));

    return this;
  }

  quiet() {
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

  toLines(enable = true) {
    this.transform('lines', enable);

    return new CommandBuilderTransform<string[]>(this);
  }

  toBoolean(test = false) {
    if (test) {
      this.quiet().and`echo ${'true'}`.or`echo ${'false'}`;
    }

    this.transform('boolean', true);

    return new CommandBuilderTransform<boolean>(this);
  }

  noThrow(enable = true) {
    this.#noThrow = enable;
    return this;
  }

  cached<T extends string>(key: string, fn: () => Promise<T>) {
    return this.connection.cached(key, fn);
  }

  clone() {
    const Constructor = this.constructor as new (
      connection: Connection,
      options: CommandBuilderOptions,
    ) => this;

    const cloned = new Constructor(this.connection, {
      command: this.command,
      transforms: this.transforms,
      quote: this.quote,
      noThrow: this.#noThrow,
      env: this.env,
      as: this.as,
    });

    return cloned;
  }

  clear() {
    this.command = [];
    this.#noThrow = false;
    this.as = undefined;
    this.env = new Env();

    return this;
  }

  $(strings: TemplateStringsArray, ...values: any[]) {
    return this.clone()
      .clear()
      .append(strings, ...values);
  }

  // helpers
  async platform() {
    return this.cached('platform', async () => {
      try {
        const platform = await this.$`uname -s`.setShellQuote().toLowerCase();
        if (platforms.includes(platform)) {
          return platform as Platform;
        }

        if (platform.includes('mingw') || platform.includes('cygwin')) {
          return Platform.WINDOWS;
        }

        throw new Error('Unsupported platform');
      } catch (error) {
        const platform = await this
          .$`powershell -command "(Get-WmiObject Win32_OperatingSystem).Caption"`
          .setPowerShellQuote()
          .toLowerCase();

        if (platforms.includes(platform)) {
          return platform as Platform;
        }

        if (platform.includes('windows')) {
          return Platform.WINDOWS;
        }
      }

      throw new Error('Unsupported platform');
    });
  }

  // env variable
  async getEnv(key: string) {
    if (this.env.has(key)) {
      return this.env.get(key);
    }

    switch (await this.platform()) {
      case Platform.WINDOWS:
        return await this.$`powershell -command "echo $env:${key}"`.setPowerShellQuote();
      default:
        return await this.$`echo $${raw(key)}`.setShellQuote();
    }
  }

  async setEnv(key: string, value: string | undefined, propagate = true) {
    if (value === undefined) {
      return this.unsetEnv(key, propagate);
    }

    this.env.set(key, value);

    if (propagate) {
      switch (await this.platform()) {
        case Platform.WINDOWS:
          return await this.$`powershell -command "set-item -path env:${key} -value ${value}"`;
        default:
          return await this.$`export ${raw(key)}=${value}`;
      }
    }
  }

  async unsetEnv(key: string, propagate = true) {
    this.env.delete(key);

    if (propagate) {
      switch (await this.platform()) {
        case Platform.WINDOWS:
          return await this.$`powershell -command "remove-item -path env:${key}"`;
        default:
          return await this.$`unset ${raw(key)}`;
      }
    }
  }
}
