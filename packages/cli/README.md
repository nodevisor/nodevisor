<p align="center">
  <img alt="Nodevisor Logo" width="150" src="https://github.com/nodevisor/logo/raw/main/nodevisor.png">
</p>

# @nodevisor/cli

> Command-line interface for server setup, deployment, service execution, and remote connections.

Part of [**Nodevisor**](https://nodevisor.com) — TypeScript Infrastructure Automation Platform

## Install

```bash
npm install @nodevisor/cli

# Or install globally
npm install -g @nodevisor/cli
```

Available as three binary names: `nv`, `nodevisor`, or `nodevisor-cli`.

## Quick Start

```bash
# 1. First time: generate keys and provision servers
nv setup production.ts --generate-keys

# 2. Deploy your application
nv deploy production.ts

# 3. Run database migrations
nv run production.ts --service migration

# 4. Debug: connect and forward ports
nv connect production.ts --forward
```

## Commands

### `nv setup <file>`

Provision and secure your servers. Installs system packages, configures the firewall, sets up SSH keys, creates deploy users, and initializes Docker Swarm.

| Flag | Description |
|------|-------------|
| `-g, --generate-keys` | Generate new SSH key pair before setup |
| `-i, --identity <path>` | Path to SSH key (default: `~/.ssh/nodevisor_id_ed25519`) |
| `-p, --passphrase <passphrase>` | Passphrase for the generated private key |

### `nv deploy <file>`

Build images, push to your registry, and deploy all services to the cluster.

| Flag | Description |
|------|-------------|
| `--no-build` | Skip the build step (deploy existing images) |
| `-l, --local` | Deploy to the local Docker daemon instead |
| `-s, --service <name>` | Deploy specific services only (repeatable) |

### `nv connect <file>`

Open an SSH connection to the master node.

| Flag | Description |
|------|-------------|
| `-f, --forward` | Forward all service ports to localhost |

### `nv run <file>`

Run a one-off service (like database migrations) on the cluster.

| Flag | Description |
|------|-------------|
| `-s, --service <name>` | Services to run (repeatable) |
| `--no-build` | Skip the build step |

## Cluster Definition File

Every CLI command requires a TypeScript cluster definition file:

```ts
// .nodevisor/production.ts
import { DockerCluster, DockerNode, ClusterUser, NodeWeb, Traefik } from 'nodevisor';

const cluster = new DockerCluster({
  name: 'production',
  nodes: [new DockerNode({ host: '10.0.0.1' })],
  users: [new ClusterUser({ username: 'root', privateKeyPath: '~/.ssh/nodevisor_id_ed25519' })],
});

cluster.addDependency(new Traefik({ ssl: { email: 'ops@example.com' } }));
cluster.addDependency(new NodeWeb({ name: 'api', appDir: './apps/api', domains: ['api.example.com'], port: 3000 }));

export default cluster;
```

## Related Packages

- [`nodevisor`](https://www.npmjs.com/package/nodevisor) — Umbrella package with all modules
- [`@nodevisor/docker`](https://www.npmjs.com/package/@nodevisor/docker) — DockerCluster used by CLI commands
- [`@nodevisor/cluster`](https://www.npmjs.com/package/@nodevisor/cluster) — Abstract cluster primitives

## Documentation

Full documentation available at [nodevisor.com/docs/packages/cli](https://nodevisor.com/docs/packages/cli)

## License

Nodevisor uses a single O'Saasy license across all packages and applications. See the full terms in [LICENSE](https://github.com/nodevisor/nodevisor/blob/main/LICENSE).
