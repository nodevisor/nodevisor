export type RegistryConfig = {};

export default class Registry {
  config: RegistryConfig;

  constructor(config: RegistryConfig) {
    this.config = config;
  }
}
