import Web, { type WebConfig } from './Web';
import NodeBuilder from '../builders/NodeBuilder';
import type Artifact from '../@types/Artifact';

export type NodeWebConfig = Omit<WebConfig, 'builder'> & {
  builder?: NodeBuilder;
  appDir?: string;
  tags?: string[];
  artifacts?: Artifact[];
};

export default class NodeWeb extends Web {
  constructor(config: NodeWebConfig) {
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
