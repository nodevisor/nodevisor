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
    const { region = this.region, tag } = options;

    const endpoint = this.aws.getECRDockerRegistryEndpoint(this.registryId, { region });
    const uri = `${endpoint}/${this.repository}`;

    if (tag) {
      return `${uri}:${tag}`;
    }

    return uri;
  }

  async getLoginCredentials(options: { region?: string } = {}) {
    const { region = this.region } = options;

    return {
      password: await this.aws.getECRLoginPassword({ region }),
      username: 'AWS',
      server: await this.aws.getECRDockerRegistryEndpoint(this.registryId, { region }),
    };
  }

  async login() {
    throw new Error('Not implemented');
  }

  async push(image: string, tag: string = 'latest', options: { region?: string } = {}) {
    throw new Error('Not implemented');
    /*
    const { region = this.region } = options;

    const imageTag = this.getURI({ tag, region });

    // Push image to ECR using AWS CLI
    console.log(`Pushing image ${imageTag} to ECR using AWS CLI`);
    await this.aws.$`ecr put-image`.argument({
      '--registry-id': this.registryId,
      '--repository-name': this.repository,
      '--image-tag': tag,
      '--region': region,
    })
      .append`--image-manifest "$(aws ecr batch-get-image --repository-name ${this.repository} --image-ids imageTag=${tag} --region ${this.region} --query 'images[].imageManifest' --output text)"`;
      */
  }
}
