import NodeBuilder from '../builders/NodeBuilder';
import type Artifact from '../@types/Artifact';
import DockerService, { type DockerServiceConfig } from '../DockerService';

type NodeConfig = Omit<DockerServiceConfig, 'builder'> & {
  builder?: NodeBuilder;
  appDir?: string;
  tags?: string[];
  artifacts?: Artifact[];
  buildCommand?: string;
  startCommand?: string;
};

export default class Node extends DockerService {
  constructor(config: NodeConfig) {
    const {
      appDir,
      tags,
      artifacts,
      buildCommand,
      startCommand,
      builder = new NodeBuilder({
        tags,
        appDir,
        artifacts,
        buildCommand,
        startCommand,
      }),
      ...rest
    } = config;

    super({
      builder,
      ...rest,
    });
  }
}
