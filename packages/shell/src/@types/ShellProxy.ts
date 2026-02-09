import type Shell from '../Shell';
import type As from './As';
import type User from '../User';
import type Module from '../Module';
import { type ModuleConfig } from '../Module';
import type CommandBuilder from '../commands/CommandBuilder';
import { type CommandBuilderOptions } from '../commands/CommandBuilder';

type ShellConfig = ConstructorParameters<typeof Shell>[0];

export default interface ShellProxy extends Function {
  (input: User): ShellProxy;
  // template strings
  (input: TemplateStringsArray, ...values: any[]): CommandBuilder;
  // clone module - deprecated because can be confusing related to which connection is used
  <TModule extends Module>(input: TModule): TModule;
  // clone module class
  <TConfig extends ModuleConfig, TClass extends typeof Module<TConfig>>(
    input: TClass,
    config?: ConstructorParameters<TClass>[1],
  ): InstanceType<TClass>;
  // clone shell
  (input: CommandBuilderOptions): ShellProxy;

  // methods
  connect(config: ShellConfig): ShellProxy;
  as: (user?: As | string) => ShellProxy;

  // properties
  shell: Shell;
  isShellProxy: true;
}
