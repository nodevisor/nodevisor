import { trimEnd, cloneDeep } from 'lodash';
import type Connection from '../connections/Connection';
import type Quote from '../@types/Quote';
import type Command from '../@types/Command';
import commandToString from '../utils/commandToString';
import quote from '../quotes/quote';
import powerShellQuote from '../quotes/powerShellQuote';
import CommandBuilderTransform from './CommandBuilderTransform';

type Transform = 'sanitize' | 'trim' | 'trimEnd' | 'toLowerCase' | 'boolean' | 'lines';

export type CommandBuilderBaseOptions = {
  command?: Command;
  transforms?: Transform[];
  quote?: Quote;
  noThrow?: boolean;
};

export default class CommandBuilderBase implements PromiseLike<string> {
  readonly connection: Connection;

  private command: Command;
  private quote?: Quote;
  private transforms: Transform[];

  #noThrow: boolean;

  constructor(connection: Connection, options: CommandBuilderBaseOptions = {}) {
    const { command = [], transforms = ['sanitize'], quote, noThrow = false } = options;

    this.connection = connection;

    this.command = cloneDeep(command);
    this.quote = quote;

    this.transforms = cloneDeep(transforms);
    this.#noThrow = noThrow;
  }

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

  append(strings: TemplateStringsArray, ...values: any[]) {
    this.command.push({ strings: strings, values });
    return this;
  }

  prepend(strings: TemplateStringsArray, ...values: any[]) {
    this.command.unshift({ strings: strings, values });
    return this;
  }

  toString() {
    const { quote } = this;
    if (!quote) {
      throw new Error('Quote is not set');
    }

    return commandToString(this.command, quote);
  }

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

  async exec() {
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

  merge(commandBuilder: CommandBuilderBase) {
    if (!(commandBuilder instanceof CommandBuilderBase)) {
      throw new Error('Can only concat with another CommandBuilderBase instance');
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
      options: CommandBuilderBaseOptions,
    ) => this;

    const cloned = new Constructor(this.connection, {
      command: this.command,
      transforms: this.transforms,
      quote: this.quote,
      noThrow: this.#noThrow,
    });

    return cloned;
  }

  clear() {
    this.command = [];
    this.#noThrow = false;
    return this;
  }

  $(strings: TemplateStringsArray, ...values: any[]) {
    return this.clone()
      .clear()
      .append(strings, ...values);
  }
}
