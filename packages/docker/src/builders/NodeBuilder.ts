import DockerfileBuilder, { type DockerfileBuilderConfig } from './DockerfileBuilder';

type NodeBuilderConfig = Omit<DockerfileBuilderConfig, 'dockerfile'> & {
  image?: string;
  node?: string;
  version?: string | number;
  distDir?: string;
  appDir?: string;
  dotEnv?: string | Record<string, string>;
  buildCommand?: string;
  startCommand?: string;
} & ({} | {});

export default class NodeBuilder extends DockerfileBuilder {
  readonly image: string;
  readonly distDir: string;
  readonly appDir: string;
  private dotEnv?: string | Record<string, string>;
  private buildCommand: string;
  private startCommand: string;

  constructor(config: NodeBuilderConfig = {}) {
    const {
      node = 'node',
      version = '22-alpine',
      image = `${node}:${version}`,
      distDir = '/dist',
      appDir = '', // /apps/api default /.
      dotEnv,
      buildCommand = 'npm run build',
      startCommand = 'npm run start',
      ...rest
    } = config;

    super(rest);

    this.image = image;
    this.distDir = distDir;
    this.appDir = appDir;
    this.dotEnv = dotEnv;
    this.buildCommand = buildCommand;
    this.startCommand = startCommand;
  }

  protected prepareDockerfile() {
    const { image, dotEnv, distDir, appDir } = this;

    const dockerfile = super.prepareDockerfile();

    const builder = dockerfile.add('builder', image);

    builder
      .add('setup')
      .workdir('/app')
      .copy('.', '.')
      .if(!!dotEnv, (stage) => stage.workdir(`/app${appDir}`).dotEnv(dotEnv));

    builder
      .add('build')
      .workdir(`/app`)
      .run('npm ci --ignore-scripts')
      .env('NODE_ENV', 'production')
      .run(this.buildCommand);

    const runner = dockerfile.add('runner', image);

    runner.add('setup').workdir('/app').env('NODE_ENV', 'production');

    runner
      .add('artifacts')
      // copy main monorepo package.json and package-lock.json
      .copy('/app/package*.json', './', { from: builder })
      // for auth packages
      .copy('/app/.npmrc', './', { from: builder })

      // copy app package.json and package-lock.json for specific app
      .copy(`/app${appDir}/package*.json`, `.${appDir}/`, { from: builder })

      .copy(`/app${appDir}${distDir}`, `.${appDir}${distDir}/`, { from: builder })
      .if(!!dotEnv, (stage) =>
        stage.copy(`/app${appDir}/.env`, `.${appDir}/.env`, { from: builder }),
      );

    runner
      .add('exec')
      .run('npm ci --omit=dev --ignore-scripts')
      .workdir(`/app${appDir}`)
      .cmd(this.startCommand);

    return dockerfile;
  }

  getBuilder() {
    return this.dockerfile.getStage('builder');
  }

  getRunner() {
    return this.dockerfile.getStage('runner');
  }

  private getArtifacts() {
    return this.getRunner().getPart('artifacts');
  }

  addArtifact(filename: string) {
    const { appDir } = this;
    const builder = this.getBuilder();

    this.getArtifacts().copy(`/app${appDir}/${filename}`, `.${appDir}/`, { from: builder });
  }
}
