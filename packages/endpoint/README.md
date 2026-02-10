<p align="center">
  <img alt="Nodevisor Logo" width="150" src="https://github.com/nodevisor/logo/raw/main/nodevisor.png">
</p>

# @nodevisor/endpoint

> Network endpoint definitions — protocol enum and pre-built port presets for firewall and service configuration.

Part of [**Nodevisor**](https://nodevisor.com) — TypeScript Infrastructure Automation Platform

## Install

```bash
npm install @nodevisor/endpoint
```

## Quick Start

```ts
import { endpoints, Protocol } from '@nodevisor/endpoint';

// Use built-in presets
endpoints.ssh;       // { port: 22, protocol: 'tcp' }
endpoints.web;       // { port: 80, protocol: 'tcp' }
endpoints.webSecure; // { port: 443, protocol: 'tcp' }

// Create custom endpoints
const api = { name: 'api', port: 8080, protocol: Protocol.TCP };
```

### Usage with UFW

```ts
import $ from '@nodevisor/shell';
import UFW from '@nodevisor/ufw';
import { endpoints } from '@nodevisor/endpoint';

const $server = $.connect({ host: '10.0.0.10', username: 'root' });
await $server(UFW).allow([endpoints.ssh, endpoints.web, endpoints.webSecure]);
```

## API

### Protocol Enum

```ts
Protocol.TCP  // 'tcp'
Protocol.UDP  // 'udp'
```

### Built-in Presets

| Preset | Port | Protocol | Use case |
|--------|------|----------|----------|
| `endpoints.ssh` | 22 | TCP | SSH access |
| `endpoints.web` | 80 | TCP | HTTP traffic |
| `endpoints.webSecure` | 443 | TCP | HTTPS traffic |
| `endpoints.dockerSwarmManagement` | 2377 | TCP | Docker Swarm cluster management |

## Related Packages

- [`@nodevisor/ufw`](https://www.npmjs.com/package/@nodevisor/ufw) — Uses endpoints for firewall rules
- [`@nodevisor/cluster`](https://www.npmjs.com/package/@nodevisor/cluster) — Nodes declare endpoint lists
- [`@nodevisor/docker`](https://www.npmjs.com/package/@nodevisor/docker) — Docker Swarm uses the management endpoint

## Documentation

Full documentation available at [nodevisor.com/docs/packages/endpoint](https://nodevisor.com/docs/packages/endpoint)

## License

Nodevisor uses a single O'Saasy license across all packages and applications. See the full terms in [LICENSE](https://github.com/nodevisor/nodevisor/blob/main/LICENSE).
