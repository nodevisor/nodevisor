<p align="center">
  <img alt="Nodevisor Logo" width="150" src="https://github.com/nodevisor/logo/raw/main/nodevisor.png">
</p>

# @nodevisor/ssh

> Install, configure, and harden the OpenSSH server.

Part of [**Nodevisor**](https://nodevisor.com) — TypeScript Infrastructure Automation Platform

## Install

```bash
npm install @nodevisor/ssh
```

## Quick Start

```ts
import $ from '@nodevisor/shell';
import SSH from '@nodevisor/ssh';

const $server = $.connect({ host: '10.0.0.10', username: 'root' });
const ssh = $server(SSH);

// Install OpenSSH server
await ssh.install();

// Disable password authentication (key-only login)
await ssh.disablePasswordAuthentication();

// Restart to apply changes
await ssh.restart();
```

### Full SSH Hardening Setup

```ts
import $, { SSH, AuthorizedKeys } from 'nodevisor';

const $server = $.connect({ host: '10.0.0.10', username: 'root' });

// First, ensure SSH keys are in place
await $server(AuthorizedKeys).writeFromFile('~/.ssh/id_ed25519.pub');

// Then disable password authentication
await $server(SSH).disablePasswordAuthentication();
```

## API

### Installation & Service

| Method | Description |
|--------|-------------|
| `install()` | Install the OpenSSH server package |
| `uninstall()` | Remove the OpenSSH server package |
| `isInstalled()` | Check if OpenSSH server is installed |
| `getVersion()` | Get the installed OpenSSH version |
| `start()` | Start the SSH service |
| `stop()` | Stop the SSH service |
| `restart()` | Restart the SSH service |
| `isRunning()` | Check if the SSH service is active |

### Security Hardening

| Method | Description |
|--------|-------------|
| `disablePasswordAuthentication(skipRestart?)` | Disable password-based SSH login |
| `enablePasswordAuthentication(skipRestart?)` | Re-enable password-based SSH login |
| `testPasswordAuthentication()` | Check if password authentication is enabled |

## Related Packages

- [`@nodevisor/authorized-keys`](https://www.npmjs.com/package/@nodevisor/authorized-keys) — Manage SSH keys before disabling passwords
- [`@nodevisor/services`](https://www.npmjs.com/package/@nodevisor/services) — Used internally for service management
- [`@nodevisor/packages`](https://www.npmjs.com/package/@nodevisor/packages) — Used internally for package installation

## Documentation

Full documentation available at [nodevisor.com/docs/packages/ssh](https://nodevisor.com/docs/packages/ssh)

## License

Nodevisor uses a single O'Saasy license across all packages and applications. See the full terms in [LICENSE](https://github.com/nodevisor/nodevisor/blob/main/LICENSE).
