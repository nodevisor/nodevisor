<p align="center">
  <img alt="Nodevisor Logo" width="150" src="https://github.com/nodevisor/logo/raw/main/nodevisor.png">
</p>

# @nodevisor/ufw

> Manage the UFW (Uncomplicated Firewall) — install, configure rules, and control the firewall.

Part of [**Nodevisor**](https://nodevisor.com) — TypeScript Infrastructure Automation Platform

## Install

```bash
npm install @nodevisor/ufw
```

## Quick Start

```ts
import $ from '@nodevisor/shell';
import UFW from '@nodevisor/ufw';
import { endpoints } from '@nodevisor/endpoint';

const $server = $.connect({ host: '10.0.0.10', username: 'root' });
const ufw = $server(UFW);

// Install UFW
await ufw.install();

// Allow common services
await ufw.allow([
  endpoints.ssh,       // port 22/tcp
  endpoints.web,       // port 80/tcp
  endpoints.webSecure, // port 443/tcp
]);

// Enable the firewall
await ufw.start();
```

## API

### Installation & Control

| Method | Description |
|--------|-------------|
| `install()` | Install the UFW package via apt |
| `isInstalled()` | Check if UFW is installed |
| `getVersion()` | Get the installed UFW version |
| `start()` | Enable the firewall (`ufw enable`) |
| `stop()` | Disable the firewall (`ufw disable`) |
| `isRunning()` | Check if the firewall is currently active |

### Rules

| Method | Description |
|--------|-------------|
| `allow(endpoint)` | Allow traffic for an endpoint or array of endpoints |
| `deleteAllow(endpoint)` | Remove a previously allowed rule |

### Usage with Custom Ports

```ts
import { Protocol } from '@nodevisor/endpoint';

// Allow a custom port
await $server(UFW).allow({ port: 8080, protocol: Protocol.TCP });
```

## Related Packages

- [`@nodevisor/endpoint`](https://www.npmjs.com/package/@nodevisor/endpoint) — Endpoint definitions and protocol constants
- [`@nodevisor/packages`](https://www.npmjs.com/package/@nodevisor/packages) — Used internally for UFW installation
- [`@nodevisor/docker`](https://www.npmjs.com/package/@nodevisor/docker) — Docker requires specific firewall rules

## Documentation

Full documentation available at [nodevisor.com/docs/packages/ufw](https://nodevisor.com/docs/packages/ufw)

## License

Nodevisor uses a single O'Saasy license across all packages and applications. See the full terms in [LICENSE](https://github.com/nodevisor/nodevisor/blob/main/LICENSE).
