import { type Debugger } from 'debug';
import log from './utils/log';
import Nodevisor, { type ExecAsMethod } from './Nodevisor';

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

  as(execAs: string, execAsMethod?: ExecAsMethod): this {
    const ModuleClass = this.constructor as {
      new (nodevisor: Nodevisor, config?: ModuleConfig): Module;
    };

    const nodevisor = this.nodevisor.as(execAs, execAsMethod);

    return new ModuleClass(nodevisor, this.config) as this;
  }

  async $(strings: TemplateStringsArray, ...values: any[]) {
    return this.nodevisor.$(strings, ...values);
  }
}
