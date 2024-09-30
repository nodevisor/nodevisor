import { type Encoding } from 'node:crypto';
import { cloneDeep, trimEnd } from 'lodash';
import type Transform from '../@types/Transform';

const defaultTransforms: Transform[] = ['sanitize'];

export type CommandOutputOptions = {
  stdout: string;
  stderr: string;
  code: number | null;
  duration?: number;
  transforms?: Transform[];
};

export default class CommandOutput {
  readonly stdout: string;
  readonly stderr: string;
  readonly code: number | null;

  // additional information
  readonly duration?: number;

  private transforms: Transform[];

  constructor(options: CommandOutputOptions) {
    const { stdout, stderr, code, duration, transforms = cloneDeep(defaultTransforms) } = options;

    this.stdout = stdout;
    this.stderr = stderr;
    this.code = code;

    this.duration = duration;
    this.transforms = transforms;

    if (this.code !== 0 && this.constructor.name !== 'CommandOutputError') {
      throw new Error('Use CommandOutputError for error outputs.');
    }
  }

  toString() {
    const value = this.code !== 0 ? this.stderr : this.stdout;

    return this.applyTransforms(value);
  }

  buffer() {
    return Buffer.from(this.toString());
  }

  text(encoding: Encoding = 'utf8') {
    return encoding === 'utf8' ? this.toString() : this.buffer().toString(encoding);
  }

  // we can not use toJSON because JSON.stringify will always try to use it, breaks tests
  json<T = any>(): T {
    return JSON.parse(this.toString());
  }

  blob(type = 'text/plain') {
    if (!globalThis.Blob) {
      throw new Error('Blob is not supported.');
    }
    return new Blob([this.buffer()], { type });
  }

  lines() {
    const value = this.toString();
    if (!value) {
      return [];
    }

    return this.toString().split(/\r?\n/);
  }

  boolean(useCode?: boolean) {
    if (useCode) {
      return this.code === 0;
    }

    const value = this.toString().trim().toLowerCase();
    const booleanValues = ['true', 'yes', '1'];
    return booleanValues.includes(value);
  }

  private applyTransforms(value: string): string {
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
        default:
          throw new Error(`Unknown transform: ${transform}`);
      }
    }

    return result;
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
}
