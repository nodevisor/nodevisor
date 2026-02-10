<p align="center">
  <img alt="Nodevisor Logo" width="150" src="https://github.com/nodevisor/logo/raw/main/nodevisor.png">
</p>

# nodevisor

> The umbrella package — one import for the entire Nodevisor platform.

Part of [**Nodevisor**](https://nodevisor.com) — TypeScript Infrastructure Automation Platform

## Install

```bash
npm install nodevisor
```

## Quick Start

```ts
import $, { OS, FS, Docker, DockerCluster, DockerNode, NodeWeb } from 'nodevisor';

// Run shell commands
const hostname = await $`hostname`.text();

// Use modules on remote servers
const $server = $.connect({ host: '10.0.0.10', username: 'root' });
const arch = await $server(OS).arch();
const content = await $server(FS).readFile('/etc/hostname');

// Build and deploy clusters
const cluster = new DockerCluster({
  name: 'production',
  nodes: [new DockerNode({ host: '10.0.0.10' })],
});

cluster.addDependency(new NodeWeb({
  name: 'api',
  appDir: './apps/api',
  domains: ['api.example.com'],
  port: 3000,
}));

await cluster.deploy();
```

## What's Included

`nodevisor` re-exports every module, type, and utility from the Nodevisor ecosystem.

### System Modules

| Export | Package | Description |
|--------|---------|-------------|
| `OS` | `@nodevisor/os` | Hostname, arch, uptime, reboot |
| `FS` | `@nodevisor/fs` | File operations (read, write, chmod, etc.) |
| `Env` | `@nodevisor/env` | Environment variables |
| `Packages` | `@nodevisor/packages` | Package manager abstraction |
| `Services` | `@nodevisor/services` | Systemd service control |
| `PWSH` | `@nodevisor/pwsh` | PowerShell command builder |

### Security Modules

| Export | Package | Description |
|--------|---------|-------------|
| `Auth` | `@nodevisor/auth` | Password management |
| `Users` | `@nodevisor/users` | User account management |
| `Groups` | `@nodevisor/groups` | Group management |
| `AuthorizedKeys` | `@nodevisor/authorized-keys` | SSH authorized keys |
| `SSH` | `@nodevisor/ssh` | SSH server management |
| `UFW` | `@nodevisor/ufw` | Firewall management |

### Orchestration

| Export | Package | Description |
|--------|---------|-------------|
| `Docker` | `@nodevisor/docker` | Docker engine, Swarm, Compose, Stack |
| `Cluster` | `@nodevisor/cluster` | Abstract cluster primitives |
| `Builder` | `@nodevisor/builder` | Image builder interface |
| `Registry` | `@nodevisor/registry` | Container registry interface |
| `AWS` | `@nodevisor/aws` | AWS CLI and ECR |

### Pre-Built Services

```ts
import {
  Traefik, Postgres, Redis,
  NodeWeb, Nextjs, WireGuard, Whoami,
  DockerBuilder, NodeBuilder,
  DockerRegistry, DockerRegistryLocal,
  DockerCluster, DockerNode, DockerSwarm,
} from 'nodevisor';
```

## When to Use This Package

**Use `nodevisor`** when you want convenience — one dependency, one import source, everything available.

```ts
import $, { Docker, UFW, Users, SSH } from 'nodevisor';
```

**Use individual packages** when you want smaller bundles or only need specific functionality:

```ts
import $ from '@nodevisor/shell';
import Docker from '@nodevisor/docker';
```

## Related Packages

- [`@nodevisor/shell`](https://www.npmjs.com/package/@nodevisor/shell) — The core shell proxy and module system
- [`@nodevisor/docker`](https://www.npmjs.com/package/@nodevisor/docker) — Docker orchestration and pre-built services
- [`@nodevisor/cli`](https://www.npmjs.com/package/@nodevisor/cli) — Command-line interface for deployment workflows

## Documentation

Full documentation available at [nodevisor.com/docs/packages/nodevisor](https://nodevisor.com/docs/packages/nodevisor)

## License

Nodevisor uses a single O'Saasy license across all packages and applications. See the full terms in [LICENSE](https://github.com/nodevisor/nodevisor/blob/main/LICENSE).
