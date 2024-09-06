import Module, { type ModuleConfig } from './Module';
import Nodevisor from './Nodevisor';

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

  // New abstract method for subclasses to implement
  protected abstract installPackage(): Promise<void>;

  abstract uninstall(): Promise<Package>;
  abstract update(): Promise<Package>;

  abstract isInstalled(): Promise<boolean>;
  abstract getVersion(): Promise<string>;
}
