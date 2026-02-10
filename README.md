<p align="center">
  <img alt="Nodevisor Logo" width="150px" src="https://github.com/nodevisor/logo/raw/main/nodevisor.png">
</p>

<h1 align="center">Nodevisor</h1>

<p align="center">
  Automate any server with TypeScript.<br>
  No YAML. No config files. Just code.
</p>

<p align="center">
  <a href="https://nodevisor.com/docs/getting-started">Getting Started</a> ·
  <a href="https://nodevisor.com/docs/packages">API Reference</a> ·
  <a href="https://nodevisor.com/docs/examples">Examples</a>
</p>

---

```sh
npm install nodevisor
```

```ts
import $, { Packages, Users, UFW, Docker, endpoints } from 'nodevisor';

const $server = $.connect({ host: '10.0.0.10', username: 'root' });

await $server(Packages).install(['curl', 'git']);
await $server(Users).add('runner');
await $server(UFW).allow([endpoints.ssh, endpoints.web, endpoints.webSecure]);
await $server(Docker).install();
```

## Why Nodevisor?

- **TypeScript Native** — Full IDE support, autocomplete, and type safety. Use real code — loops, async/await, npm packages — not YAML.
- **Agentless** — Connects over SSH with nothing to install on remote servers. No daemons, no agents — just a standard SSH connection.
- **Cross-Platform** — One API for Linux, macOS, and Windows. Auto-detects apt, yum, brew, or winget.
- **Safe by Default** — Template literal variables are automatically escaped, preventing shell injection.
- **Deploy Anywhere** — Define your production stack in TypeScript. Deploy Docker Swarm clusters with Traefik, Postgres, Redis, and your app in one command.

## How It Works

The `$` function is a shell proxy. Use template literals to run commands locally or remotely with the same API:

```ts
import $ from 'nodevisor';

// Local
const hostname = await $`hostname`.text();

// Remote — same API, just add a connection
const $server = $.connect({ host: '10.0.0.10', username: 'root' });
const remoteHostname = await $server`hostname`.text();

// Switch user without creating a new SSH connection
const $runner = $server.as('runner');
await $runner`whoami`.text(); // "runner"
```

**Modules** give you typed APIs for system management:

```ts
import $, { Packages, Users, UFW, Docker, SSH, AuthorizedKeys, endpoints } from 'nodevisor';

const $server = $.connect({ host: '10.0.0.10', username: 'root' });

// System
await $server(Packages).install(['curl', 'git', 'nginx']);
await $server(Users).add('runner');

// Security
await $server(UFW).allow([endpoints.ssh, endpoints.web, endpoints.webSecure]);
await $server(AuthorizedKeys).write(process.env.SSH_PUBLIC_KEY!);
await $server(SSH).disablePasswordAuthentication();

// Docker
await $server(Docker).install();
await $server(Docker).allowUser('runner');
```

## Docker Cluster Deployment

Define your entire production stack in TypeScript and deploy with one command:

```ts
import { DockerCluster, DockerNode, ClusterUser, Traefik, Postgres, NodeWeb } from 'nodevisor';

const cluster = new DockerCluster({
  name: 'production',
  nodes: [
    new DockerNode({ host: '10.0.0.1' }),
    new DockerNode({ host: '10.0.0.2' }),
  ],
  users: [
    new ClusterUser({
      username: 'root',
      privateKeyPath: '~/.ssh/nodevisor_id_ed25519',
    }),
  ],
});

cluster.addDependency(new Traefik({ ssl: { email: 'ops@example.com' } }));
cluster.addDependency(new Postgres({ database: 'app', username: 'app', password: process.env.DB_PASSWORD! }));
cluster.addDependency(new NodeWeb({ name: 'api', appDir: './apps/api', domains: ['api.example.com'], port: 3000 }));

// Provision servers and deploy everything
await cluster.setup();
await cluster.deploy();
```

Or use the CLI:

```sh
nv setup production.ts --generate-keys
nv deploy production.ts
```

## Why Not YAML?

<table>
<tr>
<th>Ansible</th>
<th>Nodevisor</th>
</tr>
<tr>
<td>

```yaml
# playbook.yml
---
- hosts: webservers
  become: yes
  tasks:
    - name: Install packages
      apt:
        name: "{{ item }}"
        state: present
      loop:
        - curl
        - git
        - docker.io
    - name: Create deploy user
      user:
        name: runner
        shell: /bin/bash
    - name: Configure UFW
      ufw:
        rule: allow
        port: "{{ item }}"
        proto: tcp
      loop:
        - "22"
        - "80"
        - "443"
    - name: Enable UFW
      ufw:
        state: enabled
```

</td>
<td>

```ts
// .nodevisor/setup.ts
import $, {
  Packages, Users, UFW,
  Docker, endpoints,
} from 'nodevisor';

const $s = $.connect({
  host: '10.0.0.10',
  username: 'root',
});

await $s(Packages).install(['curl', 'git']);
await $s(Users).add('runner');
await $s(UFW).allow([
  endpoints.ssh,
  endpoints.web,
  endpoints.webSecure,
]);
await $s(UFW).start();
await $s(Docker).install();
```

</td>
</tr>
</table>

## Packages

All packages are available individually or through the `nodevisor` umbrella package.

**Core**
- [@nodevisor/shell](./packages/shell) — Shell execution, SSH connections, command builder, and module system
- [@nodevisor/endpoint](./packages/endpoint) — Network endpoint definitions and protocol constants
- [@nodevisor/schema](./packages/schema) — Zod validation schemas for user configuration

**System**
- [@nodevisor/os](./packages/os) — Cross-platform OS detection and system commands
- [@nodevisor/fs](./packages/fs) — File system operations over local and remote connections
- [@nodevisor/env](./packages/env) — Environment variable management
- [@nodevisor/packages](./packages/packages) — Package manager abstraction (apt, yum, brew, winget)
- [@nodevisor/services](./packages/services) — Systemd service management
- [@nodevisor/pwsh](./packages/pwsh) — PowerShell command execution

**Security**
- [@nodevisor/auth](./packages/auth) — User password management
- [@nodevisor/users](./packages/users) — System user management
- [@nodevisor/groups](./packages/groups) — System group management
- [@nodevisor/authorized-keys](./packages/authorized-keys) — SSH authorized keys management
- [@nodevisor/ssh](./packages/ssh) — OpenSSH server installation and hardening
- [@nodevisor/ufw](./packages/ufw) — UFW firewall management
- [@nodevisor/firewall](./packages/firewall) — High-level firewall abstraction

**Orchestration**
- [@nodevisor/docker](./packages/docker) — Docker, Swarm, Compose, and pre-built services (Traefik, Postgres, Redis, etc.)
- [@nodevisor/cluster](./packages/cluster) — Abstract cluster orchestration primitives
- [@nodevisor/builder](./packages/builder) — Abstract image builder interface
- [@nodevisor/registry](./packages/registry) — Abstract container registry interface
- [@nodevisor/aws](./packages/aws) — AWS CLI and Elastic Container Registry (ECR)

**Tools**
- [@nodevisor/cli](./packages/cli) — CLI for setup, deployment, and remote connections

## Supported Platforms

- **Linux**: Ubuntu 20+, Debian 11+, Fedora 39+
- **macOS**: macOS 12+
- **Windows**: Windows 10+ (PowerShell required)

## Documentation

Full documentation at **[nodevisor.com](https://nodevisor.com/docs)**

## License

Nodevisor uses a single O'Saasy license across all packages. See [LICENSE](./LICENSE) for full terms.

## Need Help?

Open an issue on [GitHub](https://github.com/nodevisor/nodevisor/issues).
