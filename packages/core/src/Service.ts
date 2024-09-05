import Package from './Package';

export default abstract class Service extends Package {
  abstract start(): Promise<Service>;
  abstract stop(): Promise<Service>;
  abstract isRunning(): Promise<boolean>;

  async restart() {
    await this.stop();
    await this.start();

    return this;
  }
}
