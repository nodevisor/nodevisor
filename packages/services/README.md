<p align="center">
  <img alt="Nodevisor Logo" width="150" src="https://github.com/nodevisor/logo/raw/main/nodevisor.png">
</p>

# @nodevisor/services

> Manage systemd services — start, stop, restart, and check status.

Part of [**Nodevisor**](https://nodevisor.com) — TypeScript Infrastructure Automation Platform

## Install

```bash
npm install @nodevisor/services
```

## Quick Start

```ts
import $ from '@nodevisor/shell';
import Services from '@nodevisor/services';

const svc = $(Services);

// Restart a service
await svc.restart('nginx');

// Check if a service is running
if (await svc.isRunning('docker')) {
  console.log('Docker is running');
}

// Get service status
const status = await svc.status('sshd');
console.log(status);
```

### Remote Usage

```ts
const $server = $.connect({ host: '10.0.0.10', username: 'root' });
await $server(Services).restart('nginx');
```

## API

| Method | Description |
|--------|-------------|
| `start(name)` | Start a systemd service |
| `stop(name)` | Stop a systemd service |
| `restart(name)` | Restart a systemd service |
| `isRunning(name)` | Check if a service is currently active |
| `status(name)` | Get the full status output |

## Related Packages

- [`@nodevisor/ssh`](https://www.npmjs.com/package/@nodevisor/ssh) — Uses Services internally to manage sshd
- [`@nodevisor/docker`](https://www.npmjs.com/package/@nodevisor/docker) — Uses Services internally to manage dockerd
- [`@nodevisor/ufw`](https://www.npmjs.com/package/@nodevisor/ufw) — Firewall service management

## Documentation

Full documentation available at [nodevisor.com/docs/packages/services](https://nodevisor.com/docs/packages/services)

## License

Nodevisor uses a single O'Saasy license across all packages and applications. See the full terms in [LICENSE](https://github.com/nodevisor/nodevisor/blob/main/LICENSE).
