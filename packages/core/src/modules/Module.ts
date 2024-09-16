import { type Debugger } from 'debug';
import log from '../utils/log';
import Nodevisor from '../Nodevisor';
import type RunAs from '../@types/RunAs';

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

  use(nodevisor: Nodevisor): this {
    const ModuleClass = this.constructor as new (...args: any[]) => this;

    return new ModuleClass(nodevisor, this.config);
  }

  get connection() {
    return this.nodevisor.connection;
  }

  async platform() {
    return this.nodevisor.cmd().platform();
  }

  async cached<T extends string>(key: string, fn: () => Promise<T>): Promise<T> {
    return this.nodevisor.connection.cached(key, fn);
  }

  getModule<TModule extends Module>(module: new (nodevisor: Nodevisor) => TModule): TModule {
    return new module(this.nodevisor);
  }

  as(runAs: RunAs): this {
    const ModuleClass = this.constructor as {
      new (nodevisor: Nodevisor, config?: ModuleConfig): Module;
    };

    const nodevisor = this.nodevisor.as(runAs);

    return new ModuleClass(nodevisor, this.config) as this;
  }

  $(strings: TemplateStringsArray, ...values: any[]) {
    return this.nodevisor.$(strings, ...values);
  }
}
