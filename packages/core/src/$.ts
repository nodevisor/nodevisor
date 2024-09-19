import Nodevisor from './Nodevisor';
import type As from './@types/As';
import Module from './Module';
import CommandBuilder, { CommandBuilderOptions } from './commands/CommandBuilder';
import isModule from './utils/isModule';
import isTemplateStringsArray from './utils/isTemplateStringsArray';

type NodevisorConfig = ConstructorParameters<typeof Nodevisor>[0];

interface NodevisorProxyType extends Function {
  (input: TemplateStringsArray, ...values: any[]): CommandBuilder;
  <TModule extends Module>(input: TModule): TModule;
  (input: CommandBuilderOptions): ReturnType<typeof nodevisorProxy>;
  connect(config: NodevisorConfig): ReturnType<typeof nodevisorProxy>;
  as: (user?: As | string) => ReturnType<typeof nodevisorProxy>;
  nodevisor: Nodevisor;
}

function nodevisorProxy(nodevisor: Nodevisor = Nodevisor.local) {
  // template strings
  function executor(input: TemplateStringsArray, ...values: any[]): CommandBuilder;
  // clone module
  function executor<TModule extends Module>(input: TModule): TModule;
  // clone nodevisor
  function executor(input: CommandBuilderOptions): ReturnType<typeof nodevisorProxy>;
  function executor<TModule extends Module>(
    input: TemplateStringsArray | TModule | CommandBuilderOptions,
    ...values: any[]
  ) {
    if (isTemplateStringsArray(input)) {
      return nodevisor.$``.append(input as TemplateStringsArray, ...values);
    }

    if (isModule(input)) {
      return input.clone({ nodevisor });
    }

    if (typeof input === 'object') {
      return nodevisorProxy(nodevisor.clone(input));
    }

    throw new Error('Invalid input');
  }

  return new Proxy(executor as NodevisorProxyType, {
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

      throw new Error('Invalid input');
    },
  });
}

export default nodevisorProxy();
