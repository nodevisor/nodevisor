import { type NodevisorProxy } from '@nodevisor/shell';
import Registry, { type RegistryConfig } from '@nodevisor/registry';
import AWS from './AWS';

export type ECRConfig = RegistryConfig & {
  registryId: string;
  region?: string;
};

export default class ECR extends Registry {
  private registryId: string; // ${registryId}.dkr.ecr.${region}.${domain}
  private region?: string;
  private aws = new AWS();

  constructor(config: ECRConfig) {
    const { registryId, region } = config;

    super(config);

    this.registryId = registryId;
    this.region = region;
  }

  // 123456789.dkr.ecr.eu-central-1.amazonaws.com/project-web
  getURI(image: string, options: { region?: string } = {}) {
    const { region = this.region } = options;

    if (!image) {
      throw new Error('Repository is required');
    }

    const endpoint = this.aws.getECRDockerRegistryEndpoint(this.registryId, { region });
    const uri = `${endpoint}/${image}`;

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

  async login($con: NodevisorProxy) {
    throw new Error('Not implemented');
  }

  async push(image: string, options: { region?: string; tags?: string[] } = {}) {
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
