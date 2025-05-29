import Web, { type WebConfig } from './Web';
import NodeBuilder from '../builders/NodeBuilder';
import type Artifact from '../@types/Artifact';

type NextjsConfig = Omit<WebConfig, 'builder'> & {
  builder?: NodeBuilder;
  appDir?: string;
  distDir?: string;
  tags?: string[];
  artifacts?: Artifact[];
};

export default class Nextjs extends Web {
  constructor(config: NextjsConfig) {
    const {
      appDir,
      distDir = '/.next',
      tags,
      artifacts = [],
      builder = new NodeBuilder({
        tags,
        appDir,
        distDir,
        artifacts: [
          ...artifacts,
          {
            source: `/${appDir}/public`,
            dest: `/${appDir}/public/`,
          },
        ],
      }),
      ...rest
    } = config;

    super({
      builder,
      ...rest,
    });
  }
}
