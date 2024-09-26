import Nodevisor from './Nodevisor';
import type As from './@types/As';
import Module from './Module';
import { type ModuleConfig } from './Module';
import CommandBuilder, { CommandBuilderOptions } from './commands/CommandBuilder';
import isModule from './utils/isModule';
import isTemplateStringsArray from './utils/isTemplateStringsArray';
import type NodevisorProxy from './@types/NodevisorProxy';

type NodevisorConfig = ConstructorParameters<typeof Nodevisor>[0];

function nodevisorProxy(nodevisor: Nodevisor = Nodevisor.local) {
  // template strings
  function executor(input: TemplateStringsArray, ...values: any[]): CommandBuilder;
  // clone nodevisor
  function executor(input: CommandBuilderOptions): ReturnType<typeof nodevisorProxy>;
  // clone module - deprecated because can be confusing related to which connection is used
  function executor<TModule extends Module>(input: TModule): TModule;
  // clone module class
  function executor<TConfig extends ModuleConfig, TClass extends typeof Module<TConfig>>(
    input: TClass,
    config?: ConstructorParameters<TClass>[1],
  ): InstanceType<TClass>;

  function executor<TClass extends typeof Module, TModule extends Module>(
    input: TemplateStringsArray | CommandBuilderOptions | TClass | TModule,
    ...values: any[]
  ) {
    if (isTemplateStringsArray(input)) {
      return nodevisor.$``.append(input as TemplateStringsArray, ...values);
    }

    if (isModule(input)) {
      return input.clone();
    }

    // clone nodevisor proxy
    if (typeof input === 'object') {
      return nodevisorProxy(nodevisor.clone(input));
    }

    // clone module class
    if (typeof input === 'function') {
      const [config] = values;

      const ModuleClass = input;
      return new ModuleClass(nodevisor, { ...config });
    }

    throw new Error('Invalid input');
  }

  return new Proxy(executor as NodevisorProxy, {
    apply: (target, _, args) => target(args[0], ...args.slice(1)),
    get: (target, prop) => {
      if (prop === Symbol.iterator) {
        return target;
      }

      if (prop === 'connect') {
        return (config: NodevisorConfig) => nodevisorProxy(new Nodevisor(config));
      }

      if (prop === 'nodevisor') {
        return nodevisor;
      }

      if (prop === 'as') {
        return (user?: As | string) => nodevisorProxy(nodevisor.as(user));
      }

      if (prop === 'isNodevisorProxy') {
        return true;
      }

      throw new Error('Invalid input');
    },
  });
}

export default nodevisorProxy();
