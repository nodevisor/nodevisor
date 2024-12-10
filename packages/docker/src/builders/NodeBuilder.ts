import Registry from '@nodevisor/registry';
import { DockerfileStage } from '../dockerfiles';
import DockerfileBuilder, { type DockerfileBuilderConfig } from './DockerfileBuilder';

type NodeBuilderConfig = DockerfileBuilderConfig & {
  image?: string;
  node?: string;
  version?: string | number;
  distDir?: string;
  dotEnv?: string | Record<string, string>;
} & ({} | {});

export default class NodeBuilder extends DockerfileBuilder {
  readonly image: string;
  readonly distDir: string;
  private dotEnv?: string | Record<string, string>;

  constructor(config: NodeBuilderConfig = {}) {
    const {
      node = 'node',
      version = '20-alpine',
      image = `${node}:${version}`,
      distDir = 'dist',
      dotEnv,
      ...rest
    } = config;

    super(rest);

    this.image = image;
    this.distDir = distDir;
    this.dotEnv = dotEnv;
  }

  async build(image: string, registry: Registry, options: { push?: boolean; context?: string }) {
    const { image: builderImage, dotEnv, distDir } = this;

    const builder = new DockerfileStage(builderImage, 'builder')
      .workdir('/app')
      .copy('.', '.')
      .if(!!dotEnv, (stage) => stage.dotEnv(dotEnv))
      .run('npm ci --ignore-scripts')
      .env({ NODE_ENV: 'production' })
      .run('npm run build');

    const exec = new DockerfileStage(builderImage, 'exec')
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

    return super.build(image, registry, options);
  }
}
