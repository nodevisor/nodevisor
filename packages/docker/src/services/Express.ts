import Web, { type WebConfig } from './Web';
import NodeBuilder from '../builders/NodeBuilder';

type ExpressConfig = Omit<WebConfig, 'builder'> & {
  builder?: NodeBuilder;
  appDir?: string;
  distDir?: string;
  tags?: string[];
};

export default class Express extends Web {
  constructor(config: ExpressConfig) {
    const {
      appDir,
      distDir,
      tags,
      builder = new NodeBuilder({
        tags,
        appDir,
        distDir,
      }),
      ...rest
    } = config;

    super({
      builder,
      ...rest,
    });
  }
}
