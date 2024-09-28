import Package, { type PackageConfig } from './Package';

export type ServiceConfig = PackageConfig;

export default abstract class Service<
  TConfig extends ServiceConfig = ServiceConfig,
> extends Package<TConfig> {
  abstract start(): Promise<this>;
  abstract stop(): Promise<this>;
  abstract isRunning(): Promise<boolean>;

  async restart() {
    await this.stop();
    await this.start();

    return this;
  }
}
