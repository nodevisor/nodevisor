import { cloneDeep } from 'lodash';
import { type Encoding } from 'node:crypto';
import type As from '../@types/As';
import Env, { type EnvOptions } from '../Env';
import Platform from '../constants/Platform';
import type Connection from '../connections/Connection';
import type Quote from '../@types/Quote';
import type Command from '../@types/Command';
import commandToString from '../utils/commandToString';
import quote from '../quotes/quote';
import powerShellQuote from '../quotes/powerShellQuote';
import raw from '../utils/raw';
import type CommandOutput from './CommandOutput';
import CommandOutputBuilder from './CommandOutputBuilder';
import CommandOutputError from '../errors/CommandOutputError';
import { doubleQuote } from '../quotes';

const platforms = Object.values(Platform) as string[];

export type CommandBuilderOptions = {
  env?: EnvOptions;
  command?: Command;
  quote?: Quote;
  noThrow?: boolean;
  as?: As | string;
};

export default class CommandBuilder implements PromiseLike<CommandOutput> {
  readonly connection: Connection;
  private env: Env;

  private command: Command;
  private quote?: Quote;
  private prefix: string = '';
  private suffix: string = '';

  private as?: As;

  #noThrow: boolean;

  constructor(connection: Connection, options: CommandBuilderOptions = {}) {
    const { command = [], quote, noThrow = false, as, env } = options;

    this.connection = connection;
    // command has own env, we need to clone it
    this.env = new Env(env);

    this.command = cloneDeep(command);
    this.quote = quote;

    this.#noThrow = noThrow;

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

  // C-Style Quoting
  setShellQuote() {
    return this.setQuote(quote);
  }

  setPowerShellQuote() {
    return this.setQuote(powerShellQuote);
  }

  setDoubleQuote() {
    return this.setQuote(doubleQuote);
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

  appendOperator(operator: string) {
    this.command.push({ type: 'operator', strings: [operator], values: [] });
    return this;
  }

  prependOperator(operator: string) {
    this.command.unshift({ type: 'operator', strings: [operator], values: [] });
    return this;
  }

  // command methods
  append(strings: TemplateStringsArray, ...values: any[]) {
    this.command.push({ type: 'token', strings: [...strings.raw], values });
    return this;
  }

  prepend(strings: TemplateStringsArray, ...values: any[]) {
    this.command.unshift({ type: 'token', strings: [...strings.raw], values });
    return this;
  }

  toString() {
    const { quote } = this;
    if (!quote) {
      throw new Error('Quote is not set');
    }

    // copy command builder without env, as, command and noThrow
    const cloned = this.clone(true);

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

    if (cloned.command.length > 1) {
      cloned.appendOperator('&&');
    }

    cloned.merge(this);

    let cmd = commandToString(cloned.command, quote);

    if (this.as) {
      cmd = this.applyAs(cmd);
    }

    if (this.prefix) {
      cmd = `${this.prefix}${cmd}`;
    }

    if (this.suffix) {
      cmd = `${cmd}${this.suffix}`;
    }

    return cmd;
  }

  private applyAs(cmd: string): string {
    if (!this.as) {
      return cmd;
    }

    const { user, method = 'su' } = this.as;

    switch (method) {
      case 'su':
        return this.clone(true).append`su - ${user} -c ${cmd}`.toString();
      case 'runuser':
        return this.clone(true).append`runuser -l ${user} -c ${cmd}`.toString();
      default:
        throw new Error(`Unsupported user switch: ${method}`);
    }
  }

  // execution methods
  async exec(): Promise<CommandOutput> {
    if (this.quote) {
      const command = this.toString();
      try {
        return await this.connection.exec(command);
      } catch (error) {
        if (this.#noThrow) {
          if (error instanceof CommandOutputError) {
            return error;
          }
        }

        throw error;
      }
    }

    return this.clone()
      .setQuote(await this.determineQuote())
      .exec();
  }

  then<TResult1 = CommandOutput, TResult2 = never>(
    onfulfilled?: ((value: CommandOutput) => PromiseLike<TResult1> | TResult1) | undefined | null,
    onrejected?:
      | ((reason: CommandOutputError) => PromiseLike<TResult2> | TResult2)
      | undefined
      | null,
  ): Promise<TResult1 | TResult2> {
    return this.exec().then(onfulfilled, onrejected);
  }

  // logical operators
  and(strings: TemplateStringsArray, ...values: any[]) {
    this.appendOperator('&&');

    return this.append(strings, ...values);
  }

  or(strings: TemplateStringsArray, ...values: any[]) {
    this.appendOperator('||');

    return this.append(strings, ...values);
  }

  andPrepend(strings: TemplateStringsArray, ...values: any[]) {
    this.prependOperator('&&');

    return this.prepend(strings, ...values);
  }

  orPrepend(strings: TemplateStringsArray, ...values: any[]) {
    this.prependOperator('||');

    return this.prepend(strings, ...values);
  }

  merge(commandBuilder: CommandBuilder) {
    if (!(commandBuilder instanceof CommandBuilder)) {
      throw new Error('Can only concat with another CommandBuilder instance');
    }

    this.command = cloneDeep([...this.command, ...commandBuilder.command]);

    return this;
  }

  quiet() {
    return this.append` > /dev/null`;
  }

  noThrow(enable = true) {
    this.#noThrow = enable;
    return this;
  }

  cached<T extends string>(key: string, fn: () => Promise<T>) {
    return this.connection.cached(key, fn);
  }

  clone(clear = false) {
    const Constructor = this.constructor as new (
      connection: Connection,
      options: CommandBuilderOptions,
    ) => this;

    const options = clear
      ? {
          quote: this.quote,
        }
      : {
          quote: this.quote,
          command: cloneDeep(this.command),
          noThrow: this.#noThrow,
          as: this.as,
          env: this.env,
        };

    return new Constructor(this.connection, options);
  }

  // use quote based on platform
  async determineQuote() {
    const platform = await this.platform();
    const kernelName = await this.kernelName();

    if (platform === Platform.WINDOWS) {
      if (kernelName.includes('cygwin') || kernelName.includes('mingw')) {
        return quote;
      } else if (kernelName.includes('msys_nt')) {
        // msys_nt do not have support for c-style quoting
        return doubleQuote;
      }
      return powerShellQuote;
    }

    return quote;
  }

  async isBashCompatible() {
    const platform = await this.platform();
    const kernelName = await this.kernelName();

    if (platform === Platform.WINDOWS) {
      if (
        kernelName.includes('cygwin') ||
        kernelName.includes('mingw') ||
        kernelName.includes('msys_nt')
      ) {
        return true;
      }

      return false;
    }

    return true;
  }
  /*
  async shell() {
    return this.cached('shell', async () => {
      const platform = await this.platform();
      switch (platform) {
        case Platform.WINDOWS:
          return Shell.PWSH;
        default:
          return Shell.BASH;
      }
    });
  }
  */

  async kernelName() {
    return this.cached('kernelName', async () => {
      try {
        try {
          return await this.clone(true).append`uname -s`.setShellQuote().toLowerCase().text();
        } catch (error) {
          return await this.clone(true)
            .append`pwsh -command "(Get-CimInstance -ClassName Win32_OperatingSystem).Caption"`
            .setPowerShellQuote()
            .toLowerCase()
            .text();
        }
      } catch (error) {
        throw new Error('Unsupported platform');
      }
    });
  }

  async platform() {
    const kernelName = await this.kernelName();

    if (platforms.includes(kernelName)) {
      return kernelName as Platform;
    }

    if (
      kernelName.includes('mingw') ||
      kernelName.includes('cygwin') ||
      kernelName.includes('msys_nt') ||
      kernelName.includes('windows')
    ) {
      return Platform.WINDOWS;
    }

    throw new Error('Unsupported platform');
  }

  // env variable
  async getEnv(key: string, readFromSystem = false) {
    if (this.env.has(key) && !readFromSystem) {
      return this.env.get(key);
    }

    switch (await this.platform()) {
      case Platform.WINDOWS:
        return (
          (await this.clone(true).append`pwsh -command "echo $env:${key}"`
            .setPowerShellQuote()
            .text()) || undefined
        );
      default:
        return (
          (await this.clone(true).append`echo $${raw(key)}`.setShellQuote().text()) || undefined
        );
    }
  }

  async setEnv(key: string, value: string | undefined) {
    this.env.set(key, value);
    return this;
  }

  async unsetEnv(key: string) {
    this.env.set(key, undefined);
    return this;
  }

  // output type builders
  text(encoding: Encoding = 'utf8') {
    return new CommandOutputBuilder(this.exec()).text(encoding);
  }

  buffer() {
    return new CommandOutputBuilder(this.exec()).buffer();
  }

  json<T = any>() {
    return new CommandOutputBuilder(this.exec()).json<T>();
  }

  blob(type = 'text/plain') {
    return new CommandOutputBuilder(this.exec()).blob(type);
  }

  lines() {
    return new CommandOutputBuilder(this.exec()).lines();
  }

  boolean(useCode?: boolean) {
    const promise = useCode ? this.noThrow().exec() : this.exec();
    return new CommandOutputBuilder(promise).boolean(useCode);
  }

  // output transformation methods
  sanitize(enable?: boolean) {
    return new CommandOutputBuilder(this.then((output) => output.sanitize(enable)));
  }

  trim(enable?: boolean) {
    return new CommandOutputBuilder(this.then((output) => output.trim(enable)));
  }

  trimEnd(enable?: boolean) {
    return new CommandOutputBuilder(this.then((output) => output.trimEnd(enable)));
  }

  toLowerCase(enable?: boolean) {
    return new CommandOutputBuilder(this.then((output) => output.toLowerCase(enable)));
  }
}
