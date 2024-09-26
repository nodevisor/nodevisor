import Module, { type NodevisorArg, type ModuleConfig } from './Module';

export type PackageConfig = ModuleConfig & {
  dependencies?: Package[];
};

export default abstract class Package extends Module<{
  dependencies?: Package[];
}> {
  get dependencies() {
    return this.config.dependencies || [];
  }

  protected async installDependencies() {
    if (!this.dependencies.length) {
      return;
    }

    this.log('Installing dependencies');

    for (const dependency of this.dependencies) {
      await dependency.install();
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

  async uninstall() {
    if (await this.isInstalled()) {
      this.log('Not installed');
      return;
    }

    await this.uninstallPackage();
    return this;
  }

  protected abstract uninstallPackage(): Promise<void>;

  abstract update(): Promise<this>;

  abstract isInstalled(): Promise<boolean>;
  abstract getVersion(): Promise<string>;
}
