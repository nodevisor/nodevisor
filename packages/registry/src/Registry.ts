export type RegistryConfig = {};

export default abstract class Registry {
  constructor(config: RegistryConfig) {}

  abstract push(serviceName: string, image: string): Promise<void>;

  abstract getURI(options?: { tag?: string }): string;

  abstract login(): Promise<void>;

  abstract getLoginCredentials(): Promise<{
    username: string;
    password: string;
    server: string;
  }>;
}
