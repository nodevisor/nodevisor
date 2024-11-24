import type Registry from '@nodevisor/registry';

export type BuilderConfig = {
  arch?: 'amd64' | 'arm64';
  context?: string; // path to the Dockerfile
  args?: Record<string, string>; // additional arguments to pass to the build command
  tags?: string[]; // Image tags
};

export default abstract class Builder {
  protected arch: 'amd64' | 'arm64';
  protected context: string; // path to the Dockerfile
  protected args: Record<string, string>; // additional arguments to pass to the build command
  protected tags: string[]; // Image tags

  constructor(config: BuilderConfig) {
    const { arch = 'amd64', context = '.', args = {}, tags = ['latest'] } = config;

    this.arch = arch;
    this.context = context;
    this.args = args;
    this.tags = tags;
  }

  abstract build(config: {
    registry: Registry;
    push?: boolean;
    context?: string;
  }): Promise<string[]>;
}
