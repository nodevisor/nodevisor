<p align="center">
  <img alt="Nodevisor Logo" width="150" src="https://github.com/nodevisor/logo/raw/main/nodevisor.png">
</p>

# @nodevisor/cluster

> Abstract cluster primitives for multi-node orchestration — nodes, services, users, and deployment.

Part of [**Nodevisor**](https://nodevisor.com) — TypeScript Infrastructure Automation Platform

## Install

```bash
npm install @nodevisor/cluster
```

## Quick Start

In practice, you'll use [`@nodevisor/docker`](https://www.npmjs.com/package/@nodevisor/docker) which extends these abstractions with Docker-specific implementations.

```ts
import { ClusterUser, Mode } from '@nodevisor/cluster';
import { DockerCluster, DockerNode } from '@nodevisor/docker';

const cluster = new DockerCluster({
  name: 'production',
  nodes: [
    new DockerNode({ host: '10.0.0.1' }),
    new DockerNode({ host: '10.0.0.2' }),
  ],
  users: [
    new ClusterUser({
      username: 'root',
      privateKeyPath: '~/.ssh/id_ed25519',
    }),
  ],
});

await cluster.setup();
await cluster.deploy();
```

## Core Abstractions

### ClusterService

Define deployable services with ports, resources, environment, and more.

### ClusterNode

Represents a server in the cluster. The `setup()` method installs packages, configures firewall, adds SSH keys, and creates deploy users.

### Cluster

Orchestrates nodes and services together.

| Method | Description |
|--------|-------------|
| `addDependency(service)` | Add a service to the cluster |
| `getDependencies()` | Get all cluster services |
| `setup()` | Setup all nodes |
| `build(options?)` | Build all service images |
| `deploy(options?)` | Deploy all services |
| `deployLocal(options?)` | Deploy locally for development |
| `run(service, options?)` | Run a one-off service |

### ClusterUser

SSH credentials for connecting to cluster nodes.

```ts
const admin = new ClusterUser({
  username: 'root',
  privateKeyPath: '~/.ssh/id_ed25519',
  publicKeyPath: '~/.ssh/id_ed25519.pub',
});
```

### Enums

```ts
enum Mode {
  GLOBAL = 'GLOBAL',        // One instance per node
  REPLICATED = 'REPLICATED', // Specified number of replicas
}

enum ClusterType {
  DOCKER_SWARM = 'DOCKER_SWARM',
  DOCKER_COMPOSE = 'DOCKER_COMPOSE',
}
```

## Related Packages

- [`@nodevisor/docker`](https://www.npmjs.com/package/@nodevisor/docker) — Concrete Docker implementation of cluster
- [`@nodevisor/builder`](https://www.npmjs.com/package/@nodevisor/builder) — Image building interface
- [`@nodevisor/registry`](https://www.npmjs.com/package/@nodevisor/registry) — Container registry interface

## Documentation

Full documentation available at [nodevisor.com/docs/packages/cluster](https://nodevisor.com/docs/packages/cluster)

## License

Nodevisor uses a single O'Saasy license across all packages and applications. See the full terms in [LICENSE](https://github.com/nodevisor/nodevisor/blob/main/LICENSE).
