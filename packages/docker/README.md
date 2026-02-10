<p align="center">
  <img alt="Nodevisor Logo" width="150" src="https://github.com/nodevisor/logo/raw/main/nodevisor.png">
</p>

# @nodevisor/docker

> Docker management, Compose/Swarm orchestration, pre-built services, and image building.

Part of [**Nodevisor**](https://nodevisor.com) — TypeScript Infrastructure Automation Platform

## Install

```bash
npm install @nodevisor/docker
```

## Quick Start

```ts
import $ from '@nodevisor/shell';
import { Docker, DockerSwarm, DockerCluster, DockerNode, Traefik, NodeWeb } from '@nodevisor/docker';
import { ClusterUser } from '@nodevisor/cluster';

// Install Docker on a remote server
const $server = $.connect({ host: '10.0.0.10', username: 'root' });
await $server(Docker).install();
await $server(Docker).start();

// Define and deploy a cluster
const cluster = new DockerCluster({
  name: 'production',
  nodes: [new DockerNode({ host: '10.0.0.10' })],
  users: [new ClusterUser({ username: 'root', privateKeyPath: '~/.ssh/id_ed25519' })],
});

cluster.addDependency(new Traefik({ ssl: { email: 'ops@example.com' } }));
cluster.addDependency(new NodeWeb({
  name: 'api',
  appDir: './apps/api',
  domains: ['api.example.com'],
  port: 3000,
}));

await cluster.setup();
await cluster.deploy();
```

## What's Included

- **Docker** — Install, manage images, build with buildx
- **DockerSwarm** — Initialize and manage Swarm clusters
- **DockerCompose** — Run docker compose commands
- **DockerStack** — Deploy Swarm stacks
- **DockerCluster** — High-level cluster orchestration
- **Pre-built services** — Traefik, Postgres, Redis, Node.js, Next.js, WireGuard, and more
- **Builders** — DockerBuilder, NodeBuilder
- **Registries** — DockerRegistry, DockerRegistryLocal

## Key API

### Docker Module

| Method | Description |
|--------|-------------|
| `install()` / `uninstall()` | Install or remove Docker |
| `start()` / `stop()` / `restart()` | Control the Docker daemon |
| `allowUser(username)` | Add user to Docker group |
| `images()` / `pull(image)` / `push(image)` | Image management |
| `buildx(dockerfile, options?)` | Multi-platform builds |
| `login(options)` / `logout(server)` | Registry authentication |

### DockerSwarm

| Method | Description |
|--------|-------------|
| `init()` | Initialize Swarm mode |
| `join(token, host, port)` | Join a Swarm cluster |
| `getWorkerToken()` / `getManagerToken()` | Get join tokens |
| `promote(node)` / `demote(node)` | Change node roles |

### DockerCluster

| Method | Description |
|--------|-------------|
| `addDependency(service)` | Add a service to the cluster |
| `setup()` | Provision all nodes |
| `deploy()` | Build, push, and deploy all services |
| `deployLocal()` | Deploy locally with Docker Compose |

### Pre-Built Services

```ts
new Traefik({ ssl: { email: 'admin@example.com' } })
new Postgres({ database: 'app', username: 'app', password: 'secret' })
new Redis({ password: 'secret', maxmemory: '256mb' })
new NodeWeb({ name: 'api', appDir: './apps/api', domains: ['api.example.com'], port: 3000 })
new Nextjs({ name: 'web', appDir: './apps/web', domains: ['example.com'], port: 3000 })
```

## Related Packages

- [`@nodevisor/cluster`](https://www.npmjs.com/package/@nodevisor/cluster) — Abstract cluster primitives
- [`@nodevisor/builder`](https://www.npmjs.com/package/@nodevisor/builder) — Abstract builder interface
- [`@nodevisor/registry`](https://www.npmjs.com/package/@nodevisor/registry) — Abstract registry interface
- [`@nodevisor/aws`](https://www.npmjs.com/package/@nodevisor/aws) — AWS ECR registry integration

## Documentation

Full documentation available at [nodevisor.com/docs/packages/docker](https://nodevisor.com/docs/packages/docker)

## License

Nodevisor uses a single O'Saasy license across all packages and applications. See the full terms in [LICENSE](https://github.com/nodevisor/nodevisor/blob/main/LICENSE).
