import Registry, { type RegistryConfig } from '@nodevisor/registry';
import AWS from './AWS';

export type ECRConfig = RegistryConfig & {
  registryId: string;
  repository: string;
  region?: string;
};

export default class ECR extends Registry {
  private registryId: string; // ${registryId}.dkr.ecr.${region}.${domain}
  private repository: string; // repository name like project-web
  private region?: string;
  private aws = new AWS();

  constructor(config: ECRConfig) {
    const { registryId, repository, region } = config;

    super(config);

    this.registryId = registryId;
    this.repository = repository;
    this.region = region;
  }

  // 123456789.dkr.ecr.eu-central-1.amazonaws.com/project-web
  getURI(options: { region?: string; tag?: string } = {}) {
    const { region, tag } = options;

    const endpoint = this.aws.getECRDockerRegistryEndpoint(this.registryId, { region });
    const uri = `${endpoint}/${this.repository}`;

    if (tag) {
      return `${uri}:${tag}`;
    }

    return uri;
  }

  async getLoginCredentials() {
    const { region } = this;

    return {
      password: await this.aws.getECRLoginPassword({ region }),
      username: 'AWS',
      server: this.aws.getECRDockerRegistryEndpoint(this.registryId, { region }),
    };
  }
}
