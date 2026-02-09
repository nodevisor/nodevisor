import Web, { type WebConfig } from './Web';
import NodeBuilder from '../builders/NodeBuilder';
import type Artifact from '../@types/Artifact';

export type NextjsConfig = Omit<WebConfig, 'builder'> & {
  builder?: NodeBuilder;
  appDir?: string;
  tags?: string[];
  artifacts?: Artifact[];
};

export default class Nextjs extends Web {
  constructor(config: NextjsConfig) {
    const {
      appDir,
      tags,
      artifacts,
      builder = new NodeBuilder({
        tags,
        appDir,
        artifacts,
      }),
      ...rest
    } = config;

    super({
      builder,
      ...rest,
    });
  }
}
