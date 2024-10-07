export type EnvOptions = Env | Record<string, string | undefined>;

export default class Env {
  protected env: Map<string, string | undefined> = new Map();
  protected files: Set<string> = new Set();

  constructor(env?: EnvOptions) {
    if (env && env instanceof Env) {
      this.env = new Map(env.env);
      this.files = new Set(env.files);
      return;
    }

    if (env) {
      Object.entries(env).forEach(([k, v]) => this.set(k, v));
    }
  }

  get(key: string) {
    if (this.env.has(key)) {
      return this.env.get(key);
    }

    return undefined;
  }

  set(key: Record<string, string | undefined>): void;
  set(key: string, value: string | undefined): void;
  set(key: string | Record<string, string | undefined>, value?: string | undefined) {
    if (typeof key === 'object') {
      Object.entries(key).forEach(([k, v]) => this.set(k, v));
      return;
    }

    this.env.set(key, value);
  }

  has(key: string) {
    return this.env.has(key);
  }

  delete(key: string) {
    return this.set(key, undefined);
  }

  clear() {
    this.env.clear();
    this.files.clear();
  }

  public isEmpty() {
    return this.env.size === 0 && this.files.size === 0;
  }

  public toObject() {
    return Object.fromEntries(this.env);
  }

  // files
  public addFile(filepath: string) {
    this.files.add(filepath);
  }

  public deleteFile(filepath: string) {
    this.files.delete(filepath);
  }

  public getFiles() {
    return Array.from(this.files);
  }
}
