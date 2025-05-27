import Web, { type WebConfig } from './Web';
import NodeBuilder from '../builders/NodeBuilder';

type NextjsConfig = Omit<WebConfig, 'builder'> & {
  builder?: NodeBuilder;
};

export default class Nextjs extends Web {
  constructor(config: NextjsConfig) {
    const {
      builder = new NodeBuilder({
        distDir: '.next',
      }),
      ...rest
    } = config;

    super({
      builder,
      ...rest,
    });
  }
}
