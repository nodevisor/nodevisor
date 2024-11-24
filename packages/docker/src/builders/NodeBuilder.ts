import Registry from '@nodevisor/registry';
import { DockerfileStage } from '../dockerfiles';
import DockerfileBuilder, { type DockerfileBuilderConfig } from './DockerfileBuilder';

type NodeBuilderConfig = DockerfileBuilderConfig & {
  node?: string;
  nodeVersion?: string;
  nodeImage?: string;
  distDir?: string;
  dotEnv?: string | Record<string, string>;
};

export default class NodeBuilder extends DockerfileBuilder {
  readonly nodeImage: string;
  readonly distDir: string;
  private dotEnv?: string | Record<string, string>;

  constructor(config: NodeBuilderConfig = {}) {
    const {
      node = 'node',
      nodeVersion = '20-alpine',
      nodeImage = `${node}:${nodeVersion}`,
      distDir = 'dist',
      dotEnv,
      ...rest
    } = config;

    super(rest);

    this.nodeImage = nodeImage;
    this.distDir = distDir;
    this.dotEnv = dotEnv;
  }

  async build(options: { registry: Registry; push?: boolean; context?: string }) {
    const { nodeImage, dotEnv, distDir } = this;

    const builder = new DockerfileStage(nodeImage, 'builder')
      .workdir('/app')
      .copy('.', '.')
      .if(!!dotEnv, (stage) => stage.dotEnv(dotEnv))
      .run('npm ci --ignore-scripts')
      .env({ NODE_ENV: 'production' })
      .run('npm run build');

    const exec = new DockerfileStage(nodeImage, 'exec')
      .workdir('/app')
      .env('NODE_ENV', 'production')
      .copy('/app/package*.json', '.', { from: builder })
      .copy(`/app/${distDir}`, `./${distDir}`, { from: builder })
      .if(!!dotEnv, (stage) =>
        stage
          .copy('/app/.env', './.env', { from: builder })
          .copy('/app/.env', './.env', { from: builder }),
      )
      .run('npm ci --omit=dev --ignore-scripts')
      .cmd('npm run start');

    this.dockerfile.clear().add(builder).add(exec);

    return super.build(options);
  }
}
