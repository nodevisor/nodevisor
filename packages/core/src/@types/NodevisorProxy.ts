import type Nodevisor from '../Nodevisor';
import type As from './As';
import type User from '../User';
import type Module from '../Module';
import { type ModuleConfig } from '../Module';
import type CommandBuilder from '../commands/CommandBuilder';
import { type CommandBuilderOptions } from '../commands/CommandBuilder';

type NodevisorConfig = ConstructorParameters<typeof Nodevisor>[0];

export default interface NodevisorProxy extends Function {
  (input: User): NodevisorProxy;
  // template strings
  (input: TemplateStringsArray, ...values: any[]): CommandBuilder;
  // clone module - deprecated because can be confusing related to which connection is used
  <TModule extends Module>(input: TModule): TModule;
  // clone module class
  <TConfig extends ModuleConfig, TClass extends typeof Module<TConfig>>(
    input: TClass,
    config?: ConstructorParameters<TClass>[1],
  ): InstanceType<TClass>;
  // clone nodevisor
  (input: CommandBuilderOptions): NodevisorProxy;

  // methods
  connect(config: NodevisorConfig): NodevisorProxy;
  as: (user?: As | string) => NodevisorProxy;

  // properties
  nodevisor: Nodevisor;
  isNodevisorProxy: true;
}
