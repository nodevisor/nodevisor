import Shell from './Shell';
import type As from './@types/As';
import Module from './Module';
import type User from './User';
import { type ModuleConfig } from './Module';
import CommandBuilder, { CommandBuilderOptions } from './commands/CommandBuilder';
import isModule from './utils/isModule';
import isUser from './utils/isUser';
import isTemplateStringsArray from './utils/isTemplateStringsArray';
import type ShellProxy from './@types/ShellProxy';

type ShellConfig = ConstructorParameters<typeof Shell>[0];

function shellProxy(shell: Shell = Shell.local) {
  // connect with user
  function executor(input: User): ReturnType<typeof shellProxy>;
  // clone module - deprecated because can be confusing related to which connection is used
  function executor<TModule extends Module>(input: TModule): TModule;
  // template strings
  function executor(input: TemplateStringsArray, ...values: any[]): CommandBuilder;

  // clone shell
  function executor(input: CommandBuilderOptions): ReturnType<typeof shellProxy>;

  // clone module class
  function executor<TConfig extends ModuleConfig, TClass extends typeof Module<TConfig>>(
    input: TClass,
    config?: ConstructorParameters<TClass>[1],
  ): InstanceType<TClass>;

  function executor<TClass extends typeof Module, TModule extends Module>(
    input: TemplateStringsArray | CommandBuilderOptions | TClass | TModule | User,
    ...values: any[]
  ) {
    if (isUser(input)) {
      return shellProxy(new Shell(input.getSSHConnectionConfig()));
    }

    if (isModule(input)) {
      return input.clone();
    }

    if (isTemplateStringsArray(input)) {
      return shell.cmd().append(input as TemplateStringsArray, ...values);
    }

    // clone shell proxy
    if (typeof input === 'object') {
      return shellProxy(shell.clone(input));
    }

    // clone module class
    if (typeof input === 'function') {
      const [config] = values;

      const ModuleClass = input;
      return new ModuleClass(shell, { ...config });
    }

    throw new Error('Invalid input');
  }

  return new Proxy(executor as ShellProxy, {
    apply: (target, _, args) => target(args[0], ...args.slice(1)),
    get: (target, prop) => {
      if (prop === Symbol.iterator) {
        return target;
      }

      if (prop === 'connect') {
        return (config: ShellConfig) => shellProxy(new Shell(config));
      }

      if (prop === 'shell') {
        return shell;
      }

      if (prop === 'as') {
        return (user?: As | string) => shellProxy(shell.as(user));
      }

      if (prop === 'isShellProxy') {
        return true;
      }

      throw new Error('Invalid input');
    },
  });
}

export default shellProxy();
