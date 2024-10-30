import type Registry from './Registry';

export type BuilderConfig = {
  arch: 'amd64' | 'arm64';
  context?: string; // path to the Dockerfile
  dockerfile?: string; // path to the Dockerfile, defaults to Dockerfile
  args?: Record<string, string>; // additional arguments to pass to the build command
};

export class Builder {
  config: BuilderConfig;

  constructor(config: BuilderConfig) {
    this.config = config;
  }

  build(registry: Registry) {}
}
