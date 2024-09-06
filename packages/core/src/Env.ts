import type Quote from './@types/Quote';

export default class Env {
  private env: Map<string, string> = new Map();

  private files: Set<string> = new Set();

  public constructor(env?: Env) {
    if (env) {
      this.env = new Map(env.env);
      this.files = new Set(env.files);
    }
  }

  public has(key: string) {
    return this.env.has(key);
  }

  public get(key: string) {
    return this.env.get(key);
  }

  public set(key: string | Record<string, string>, value?: string) {
    if (typeof key === 'object') {
      Object.entries(key).forEach(([k, v]) => this.set(k, v));
      return;
    }

    if (typeof value === 'undefined') {
      this.delete(key);
      return;
    }

    this.env.set(key, value);
  }

  public delete(key: string) {
    this.env.delete(key);
  }

  public toObject() {
    return Object.fromEntries(this.env);
  }

  public addFile(filepath: string) {
    this.files.add(filepath);
  }

  public removeFile(filepath: string) {
    this.files.delete(filepath);
  }

  public getFiles() {
    return Array.from(this.files);
  }

  public clear() {
    this.env.clear();
    this.files.clear();
  }

  public isEmpty() {
    return this.env.size === 0 && this.files.size === 0;
  }

  public getCommand(escape: Quote) {
    const { env, files } = this;

    const envCommands = Array.from(env).map(
      ([key, value]) => `export ${escape(key)}=${escape(value)}`,
    );

    const filesCommands = Array.from(files).map((file) => `source ${escape(file)}`);

    const cmds: string[] = [];

    if (envCommands.length) {
      cmds.push(envCommands.join(' && '));
    }

    if (filesCommands.length) {
      cmds.push(`set -a && ${filesCommands.join(' && ')} && set +a`);
    }

    return cmds.join(' && ');
  }
}
