import Registry, { type RegistryConfig } from '../Registry';

export type ECRConfig = RegistryConfig & {
  registryId: string;
  repository: string;
};

export default class ECR extends Registry {
  private registryId: string;
  private repository: string;

  constructor(config: ECRConfig) {
    const { registryId, repository } = config;

    super(config);

    this.registryId = registryId;
    this.repository = repository;
  }
}
