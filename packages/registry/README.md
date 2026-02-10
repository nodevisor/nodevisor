<p align="center">
  <img alt="Nodevisor Logo" width="150" src="https://github.com/nodevisor/logo/raw/main/nodevisor.png">
</p>

# @nodevisor/registry

> Abstract container registry interface for Docker image management.

Part of [**Nodevisor**](https://nodevisor.com) — TypeScript Infrastructure Automation Platform

## Install

```bash
npm install @nodevisor/registry
```

## Quick Start

```ts
import Registry from '@nodevisor/registry';

// Static helpers — work without a registry instance
const tag = Registry.getTag('myapp:v1.0');         // "v1.0"
const image = Registry.getImage('myapp:v1.0');      // "myapp"
const full = Registry.getImageWithTag('myapp');      // "myapp:latest"
const hasTag = Registry.hasTag('myapp:v1.0');        // true
```

## API

### Static Methods

| Method | Description |
|--------|-------------|
| `Registry.getTag(image, defaultTag?)` | Extract the tag from an image name |
| `Registry.getImage(image)` | Extract the image name without the tag |
| `Registry.getImageWithTag(image, defaultTag?)` | Get the full image name with tag |
| `Registry.hasTag(image)` | Check if an image string includes a tag |

### Abstract Methods (for implementations)

| Method | Description |
|--------|-------------|
| `push(image, options?)` | Push an image to the registry |
| `login($con)` | Authenticate to the registry on a connection |
| `getLoginCredentials()` | Get authentication credentials |

### Implementations

| Class | Package | Use case |
|-------|---------|----------|
| `DockerRegistry` | `@nodevisor/docker` | Docker Hub, GitHub Container Registry, etc. |
| `DockerRegistryLocal` | `@nodevisor/docker` | Local development (no remote push) |
| `ECR` | `@nodevisor/aws` | AWS Elastic Container Registry |

## Related Packages

- [`@nodevisor/docker`](https://www.npmjs.com/package/@nodevisor/docker) — DockerRegistry and DockerRegistryLocal
- [`@nodevisor/aws`](https://www.npmjs.com/package/@nodevisor/aws) — ECR implementation
- [`@nodevisor/builder`](https://www.npmjs.com/package/@nodevisor/builder) — Builders push to registries

## Documentation

Full documentation available at [nodevisor.com/docs/packages/registry](https://nodevisor.com/docs/packages/registry)

## License

Nodevisor uses a single O'Saasy license across all packages and applications. See the full terms in [LICENSE](https://github.com/nodevisor/nodevisor/blob/main/LICENSE).
