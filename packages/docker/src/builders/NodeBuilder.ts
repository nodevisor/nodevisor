import { DockerfileStage } from '../dockerfiles';
import DockerfileBuilder, { type DockerfileBuilderConfig } from './DockerfileBuilder';
import type Artifact from '../@types/Artifact';

export type NodeBuilderConfig = Omit<DockerfileBuilderConfig, 'dockerfile'> & {
  image?: string;
  node?: string;
  version?: string | number;
  appDir?: string;
  dotEnv?: string | Record<string, string>;
  artifacts?: Artifact[];
  buildCommand?: string;
  startCommand?: string;
};

export default class NodeBuilder extends DockerfileBuilder {
  readonly image: string;
  readonly appDir: string;
  private dotEnv?: string | Record<string, string>;
  private artifacts: Artifact[];
  private buildCommand: string;
  private startCommand: string;

  constructor(config: NodeBuilderConfig = {}) {
    const {
      node = 'node',
      version = '22-alpine',
      image = `${node}:${version}`,
      appDir = '', // /apps/api default /.
      artifacts = [],
      dotEnv,
      buildCommand = 'npm run build',
      startCommand = 'npm run start',
      ...rest
    } = config;

    super(rest);

    this.image = image;
    this.appDir = appDir;
    this.dotEnv = dotEnv;
    this.artifacts = artifacts;
    this.buildCommand = buildCommand;
    this.startCommand = startCommand;
  }

  protected prepareDockerfile() {
    const { image, dotEnv, appDir } = this;

    const dockerfile = super.prepareDockerfile();

    const builder = dockerfile.add('builder', image);

    builder.add('setup').workdir('/app').copy('.', '.');

    builder
      .add('build')
      .workdir(`/app`)
      .run('npm ci --ignore-scripts')
      .env('NODE_ENV', 'production')
      .run(this.buildCommand)
      // remove dev dependencies
      .run('npm prune --production');

    const runner = dockerfile.add('runner', image);

    runner.add('setup').workdir('/app').env('NODE_ENV', 'production');

    runner
      .add('artifacts')

      // copy all files from builder to runner
      .copy('/app', '/app/', { from: builder })

      // copy all artifacts from builder to runner
      .forEach(this.artifacts, (stage, artifact) => {
        const { source, dest = appDir ? `${appDir}/` : '/', from = builder } = artifact;
        if (!source) {
          throw new Error('Source is required');
        }

        stage.copy(`/app${source}`, `/app${dest}`, { from });
      })

      .if(!!dotEnv, (stage) => stage.workdir(`/app${appDir}`).dotEnv(dotEnv));

    runner.add('exec').workdir(`/app${appDir}`).cmd(this.startCommand);

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

  // add artifacts to the runner, user can add files or directories, and use custom source/dest paths
  addArtifact(source: string, dest: string, from: DockerfileStage | string = this.getBuilder()) {
    this.getArtifacts().copy(`/app${source}`, `/app${dest}`, { from });
    return this;
  }
}
