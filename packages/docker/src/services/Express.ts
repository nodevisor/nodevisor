import Web, { type WebConfig } from './Web';
import NodeBuilder from '../builders/NodeBuilder';
import type Artifact from '../@types/Artifact';

type ExpressConfig = Omit<WebConfig, 'builder'> & {
  builder?: NodeBuilder;
  appDir?: string;
  distDir?: string;
  tags?: string[];
  artifacts?: Artifact[];
};

export default class Express extends Web {
  constructor(config: ExpressConfig) {
    const {
      appDir,
      distDir,
      tags,
      artifacts,
      builder = new NodeBuilder({
        tags,
        appDir,
        distDir,
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
