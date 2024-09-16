export default class EnvBase {
  protected env: Map<string, string> = new Map();
  protected files: Set<string> = new Set();

  constructor(env?: EnvBase) {
    if (env) {
      this.env = new Map(env.env);
      this.files = new Set(env.files);
    }
  }

  async get(key: string) {
    if (await this.env.has(key)) {
      return this.env.get(key);
    }

    return undefined;
  }

  async set(key: Record<string, string | undefined>): Promise<void>;
  async set(key: string, value: string | undefined): Promise<void>;
  async set(key: string | Record<string, string | undefined>, value?: string | undefined) {
    if (typeof key === 'object') {
      Object.entries(key).forEach(([k, v]) => this.set(k, v));
      return;
    }

    if (typeof value === 'undefined') {
      if (this.env.has(key)) {
        this.env.delete(key);
      }
      return;
    }

    this.env.set(key, value);
  }

  async has(key: string) {
    const value = await this.get(key);
    return value !== undefined;
  }

  async delete(key: string) {
    return this.set(key, undefined);
  }

  async clear() {
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
