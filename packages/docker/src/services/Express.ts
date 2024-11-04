import Web, { type WebConfig } from './Web';
import NodeBuilder from '../builders/NodeBuilder';

type ExpressConfig = Omit<WebConfig, 'builder'> & {
  builder?: NodeBuilder;
};

export default class Express extends Web {
  constructor(config: ExpressConfig) {
    const { builder = new NodeBuilder(), ...rest } = config;

    super({
      builder,
      ...rest,
    });
  }
}
