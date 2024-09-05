import { type Debugger } from 'debug';
import log from './utils/log';
import Module, { type ModuleConfig } from './Module';
import Nodevisor, { type ExecAsMethod } from './Nodevisor';

export type PackageConfig = ModuleConfig & {
  dependencies?: (new (nodevisor: Nodevisor) => Package)[];
};

export default abstract class Package extends Module {
  protected dependencies: (new (nodevisor: Nodevisor) => Package)[];

  constructor(nodevisor: Nodevisor, config: PackageConfig = {}) {
    const { dependencies = [], ...rest } = config;

    super(nodevisor, rest);

    this.dependencies = dependencies;
  }

  protected async installDependencies() {
    if (!this.dependencies.length) {
      return;
    }

    this.log('Installing dependencies');

    for (const Dependency of this.dependencies) {
      const instance = new Dependency(this.nodevisor);
      await instance.install();
    }
  }

  async install() {
    if (await this.isInstalled()) {
      this.log('Already installed');
      return;
    }

    await this.installDependencies();

    await this.installPackage();

    this.log('Installed');

    return this;
  }

  as(execAs: string, execAsMethod?: ExecAsMethod): this {
    const PackageClass = this.constructor as {
      new (nodevisor: Nodevisor, config?: PackageConfig): Package;
    };

    const nodevisor = this.nodevisor.as(execAs, execAsMethod);

    return new PackageClass(nodevisor, this.config) as this;
  }

  // New abstract method for subclasses to implement
  protected abstract installPackage(): Promise<void>;

  abstract uninstall(): Promise<Package>;
  abstract update(): Promise<Package>;

  abstract isInstalled(): Promise<boolean>;
  abstract getVersion(): Promise<string>;
}
