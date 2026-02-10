<p align="center">
  <img alt="Nodevisor Logo" width="150" src="https://github.com/nodevisor/logo/raw/main/nodevisor.png">
</p>

# @nodevisor/aws

> AWS CLI management and Elastic Container Registry (ECR) integration.

Part of [**Nodevisor**](https://nodevisor.com) — TypeScript Infrastructure Automation Platform

## Install

```bash
npm install @nodevisor/aws
```

## Quick Start

### AWS CLI

```ts
import $ from '@nodevisor/shell';
import AWS from '@nodevisor/aws';

const $server = $.connect({ host: '10.0.0.10', username: 'root' });
const aws = $server(AWS);

// Install AWS CLI
await aws.install();

// Configure credentials
await aws.setCredentials('AKIAIOSFODNN7EXAMPLE', 'wJalrXUtnFEMI/K7MDENG/secret');
await aws.setDefaultRegion('eu-central-1');
```

### ECR (Elastic Container Registry)

```ts
import { ECR } from '@nodevisor/aws';

const ecr = new ECR({
  registryId: '123456789012',
  region: 'eu-central-1',
});

// Get the registry URI for an image
const uri = ecr.getURI('myapp');
// "123456789012.dkr.ecr.eu-central-1.amazonaws.com/myapp"

// Login to ECR on a remote connection
await ecr.login($server);
```

### Using ECR with DockerCluster

```ts
import { DockerCluster, DockerNode } from '@nodevisor/docker';
import { ECR } from '@nodevisor/aws';

const cluster = new DockerCluster({
  name: 'production',
  nodes: [new DockerNode({ host: '10.0.0.10' })],
  registry: new ECR({
    registryId: '123456789012',
    region: 'eu-central-1',
  }),
});
```

## API

### AWS CLI

| Method | Description |
|--------|-------------|
| `install()` | Install the AWS CLI |
| `isInstalled()` | Check if AWS CLI is installed |
| `getVersion()` | Get AWS CLI version |
| `set(key, value, profile?)` | Set a configuration value |
| `get(key, profile?)` | Get a configuration value |
| `setDefaultRegion(region)` | Set the default AWS region |
| `setCredentials(accessKeyId, secretAccessKey)` | Configure AWS access credentials |

### ECR

| Method | Description |
|--------|-------------|
| `getURI(image, options?)` | Get the full ECR URI for an image |
| `getLoginCredentials(options?)` | Get credentials for Docker login |
| `login($con)` | Login to ECR on a remote connection |

## Related Packages

- [`@nodevisor/docker`](https://www.npmjs.com/package/@nodevisor/docker) — Docker cluster deployment
- [`@nodevisor/registry`](https://www.npmjs.com/package/@nodevisor/registry) — Abstract registry interface (ECR extends this)

## Documentation

Full documentation available at [nodevisor.com/docs/packages/aws](https://nodevisor.com/docs/packages/aws)

## License

Nodevisor uses a single O'Saasy license across all packages and applications. See the full terms in [LICENSE](https://github.com/nodevisor/nodevisor/blob/main/LICENSE).
