import Module, { type ModuleConfig } from './Module';

export type PackageConfig = ModuleConfig & {};

export default abstract class Package<TConfig extends PackageConfig = PackageConfig> extends Module<
  TConfig & {
    dependencies?: Package<any>[];
  }
> {
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
  }

  // New abstract method for subclasses to implement
  protected abstract installPackage(): Promise<void>;

  async uninstall() {
    if (await this.isInstalled()) {
      this.log('Not installed');
      return;
    }

    await this.uninstallPackage();
  }

  protected abstract uninstallPackage(): Promise<void>;

  abstract isInstalled(): Promise<boolean>;
  abstract getVersion(): Promise<string>;
}
