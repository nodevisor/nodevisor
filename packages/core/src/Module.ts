import { type Debugger } from 'debug';
import log from './utils/log';
import Nodevisor from './Nodevisor';

export type ModuleConfig = {
  nodevisor?: Nodevisor;
};

type AbstractConstructorHelper<T> = (new (...args: any) => { [x: string]: any }) & T;
type AbstractContructorParameters<T> = ConstructorParameters<AbstractConstructorHelper<T>>;

export default class Module {
  protected nodevisor: Nodevisor;
  protected log: Debugger;
  readonly name: string = 'moudle';

  protected config: ModuleConfig;

  constructor(config: ModuleConfig = {}) {
    const { nodevisor = Nodevisor.local } = config;

    this.nodevisor = nodevisor;
    this.config = config;

    this.name = 'module';

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

  clone<TClass extends this>(config: Partial<AbstractContructorParameters<TClass>[0]> = {}): this {
    const { nodevisor = this.nodevisor, ...moduleConfig } = {
      ...this.config,
      ...config,
    };

    const ModuleClass = this.constructor as {
      new (config: AbstractContructorParameters<TClass>[0]): TClass;
    };

    return new ModuleClass({
      nodevisor,
      ...moduleConfig,
    });
  }

  $(strings: TemplateStringsArray, ...values: any[]) {
    return this.nodevisor.$(strings, ...values);
  }

  // create a new module instance
  module<TClass extends typeof Module>(
    moduleClass: TClass,
    config?: ConstructorParameters<TClass>[0],
  ): InstanceType<TClass>;
  // create a new module instance from an existing module
  module<TModule extends Module>(
    module: TModule,
    config?: Partial<AbstractContructorParameters<TModule>[0]>,
  ): TModule;
  module(module: any, config?: any) {
    if (module instanceof Module) {
      return module.clone(config);
    }

    const ModuleClass = module as {
      new (config: ModuleConfig): Module;
    };

    return new ModuleClass({
      nodevisor: this.nodevisor,
      ...config,
    });
  }
}
