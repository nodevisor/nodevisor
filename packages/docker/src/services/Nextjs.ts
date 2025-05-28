import Web, { type WebConfig } from './Web';
import NodeBuilder from '../builders/NodeBuilder';

type NextjsConfig = Omit<WebConfig, 'builder'> & {
  builder?: NodeBuilder;
  appDir?: string;
  distDir?: string;
  tags?: string[];
};

export default class Nextjs extends Web {
  constructor(config: NextjsConfig) {
    const {
      appDir,
      distDir = '/.next',
      tags,
      builder = new NodeBuilder({
        tags,
        appDir,
        distDir,
      }),
      ...rest
    } = config;

    builder.addArtifact('/public');

    super({
      builder,
      ...rest,
    });
  }
}
