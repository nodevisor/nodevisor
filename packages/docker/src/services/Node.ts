import NodeBuilder from '../builders/NodeBuilder';
import type Artifact from '../@types/Artifact';
import DockerService, { type DockerServiceConfig } from '../DockerService';

type NodeConfig = Omit<DockerServiceConfig, 'builder'> & {
  builder?: NodeBuilder;
  appDir?: string;
  tags?: string[];
  artifacts?: Artifact[];
};

export default class Express extends DockerService {
  constructor(config: NodeConfig) {
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
