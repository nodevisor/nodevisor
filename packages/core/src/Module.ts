import { type Debugger } from 'debug';
import log from './utils/log';
import Nodevisor from './Nodevisor';
import type RunAs from './@types/RunAs';
import { type CommandBuilderOptions } from './CommandBuilder';

export type ModuleConfig = {
  name?: string;
};

export default abstract class Module {
  protected log: Debugger;
  protected nodevisor: Nodevisor;
  protected config: ModuleConfig;

  constructor(nodevisor: Nodevisor, config: ModuleConfig = {}) {
    const { name = this.constructor.name } = config;

    this.nodevisor = nodevisor;
    this.config = config;

    this.log = log.extend(name);
  }

  private get cache() {
    return this.nodevisor.connection.cache;
  }

  async cached<T extends string>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.cache.has(key)) {
      return this.cache.get(key) as T;
    }

    const value = await fn();
    this.cache.set(key, value);

    return value;
  }

  as(runAs: RunAs): this {
    const ModuleClass = this.constructor as {
      new (nodevisor: Nodevisor, config?: ModuleConfig): Module;
    };

    const nodevisor = this.nodevisor.as(runAs);

    return new ModuleClass(nodevisor, this.config) as this;
  }

  cmd(options: CommandBuilderOptions = {}) {
    return this.nodevisor.cmd(options);
  }

  $(strings: TemplateStringsArray, ...values: any[]) {
    return this.nodevisor.$(strings, ...values);
  }
}
