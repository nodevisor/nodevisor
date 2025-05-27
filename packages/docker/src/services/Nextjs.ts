import Web, { type WebConfig } from './Web';
import NodeBuilder from '../builders/NodeBuilder';

type NextjsConfig = Omit<WebConfig, 'builder'> & {
  builder?: NodeBuilder;
  appDir?: string;
};

export default class Nextjs extends Web {
  constructor(config: NextjsConfig) {
    const {
      appDir,
      builder = new NodeBuilder({
        appDir,
        distDir: '/.next',
      }),
      ...rest
    } = config;

    super({
      builder,
      ...rest,
    });
  }
}
