import { type Debugger } from 'debug';
import log from './utils/log';
import Nodevisor from './Nodevisor';
import type NodevisorProxy from './@types/NodevisorProxy';

export type NodevisorArg = Nodevisor | NodevisorProxy;
export type ModuleConfig = {};

type AbstractConstructorHelper<T> = (new (...args: any) => { [x: string]: any }) & T;
type AbstractContructorParameters<T> = ConstructorParameters<AbstractConstructorHelper<T>>;

export default class Module<TConfig extends ModuleConfig = ModuleConfig> {
  protected nodevisor: Nodevisor;
  protected config: TConfig;

  protected log: Debugger;
  readonly name: string = 'module';

  constructor(
    nodevisor: Nodevisor | NodevisorProxy = Nodevisor.local,
    config: TConfig = {} as TConfig,
  ) {
    this.nodevisor = nodevisor instanceof Nodevisor ? nodevisor : nodevisor.nodevisor;
    this.config = config;

    this.log = log.extend(this.name);
  }

  get connection() {
    return this.nodevisor.connection;
  }

  async platform() {
    return this.nodevisor.platform();
  }

  async cached<T extends string>(key: string, fn: () => Promise<T>): Promise<T> {
    return this.nodevisor.connection.cached(key, fn);
  }

  clone<TClass extends this>(config: Partial<AbstractContructorParameters<TClass>[1]> = {}): this {
    const ModuleClass = this.constructor as {
      new (nodevisor: NodevisorArg, config: AbstractContructorParameters<TClass>[1]): TClass;
    };

    return new ModuleClass(this.nodevisor, {
      ...this.config,
      ...config,
    });
  }

  $(strings: TemplateStringsArray, ...values: any[]) {
    return this.nodevisor.$(strings, ...values);
  }
}
