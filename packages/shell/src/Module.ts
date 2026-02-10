import { type Debugger } from 'debug';
import log from './utils/log';
import Shell from './Shell';
import type ShellProxy from './@types/ShellProxy';

export type ShellArg = Shell | ShellProxy;
export type ModuleConfig = {};

type AbstractConstructorHelper<T> = (new (...args: any) => { [x: string]: any }) & T;
type AbstractContructorParameters<T> = ConstructorParameters<AbstractConstructorHelper<T>>;

export default class Module<TConfig extends ModuleConfig = ModuleConfig> {
  protected shell: Shell;
  protected config: TConfig;

  protected log: Debugger;
  readonly name: string = 'module';

  constructor(shell: Shell | ShellProxy = Shell.local, config: TConfig = {} as TConfig) {
    this.shell = shell instanceof Shell ? shell : shell.shell;
    this.config = config;

    this.log = log.extend(this.name);
  }

  // backward-compatible alias for this.shell (used by child classes across packages)
  protected get nodevisor(): Shell {
    return this.shell;
  }

  get connection() {
    return this.shell.connection;
  }

  async platform() {
    return this.shell.platform();
  }

  async cached<T extends string>(key: string, fn: () => Promise<T>): Promise<T> {
    return this.shell.connection.cached(key, fn);
  }

  clone<TClass extends this>(config: Partial<AbstractContructorParameters<TClass>[1]> = {}): this {
    const ModuleClass = this.constructor as {
      new (shell: ShellArg, config: AbstractContructorParameters<TClass>[1]): TClass;
    };

    return new ModuleClass(this.shell, {
      ...this.config,
      ...config,
    });
  }

  $(strings: TemplateStringsArray, ...values: any[]) {
    return this.shell.$(strings, ...values);
  }
}
