<p align="center">
  <img alt="Nodevisor Logo" width="150" src="https://github.com/nodevisor/logo/raw/main/nodevisor.png">
</p>

# @nodevisor/packages

> Cross-platform package manager abstraction — apt, yum, brew, and winget unified under one API.

Part of [**Nodevisor**](https://nodevisor.com) — TypeScript Infrastructure Automation Platform

## Install

```bash
npm install @nodevisor/packages
```

## Quick Start

```ts
import $ from '@nodevisor/shell';
import Packages from '@nodevisor/packages';

const pkg = $(Packages);

// Update package lists and upgrade all packages
await pkg.updateAndUpgrade();

// Install packages
await pkg.install(['curl', 'git', 'unzip']);

// Check if a package is installed
if (await pkg.isInstalled('docker-ce')) {
  console.log('Docker is already installed');
}
```

### Remote Usage

```ts
const $server = $.connect({ host: '10.0.0.10', username: 'root' });

await $server(Packages).updateAndUpgrade();
await $server(Packages).install('nginx');
```

## Supported Package Managers

| Package Manager | Platforms | Detection |
|----------------|-----------|-----------|
| `apt` | Debian, Ubuntu | Auto-detected |
| `yum` | CentOS, RHEL, Fedora | Auto-detected |
| `brew` | macOS | Auto-detected |
| `winget` | Windows | Auto-detected |

## API

| Method | Description |
|--------|-------------|
| `packageManager()` | Detect which package manager is available |
| `update()` | Update the package list |
| `upgrade()` | Upgrade all installed packages |
| `updateAndUpgrade()` | Run both update and upgrade in sequence |
| `install(packages)` | Install one or more packages |
| `uninstall(name)` | Remove an installed package |
| `isInstalled(name)` | Check if a package is installed |
| `isUpgradable(name)` | Check if a package has an available upgrade |
| `requireInstalled(name)` | Throw if a package is not installed |

## Related Packages

- [`@nodevisor/os`](https://www.npmjs.com/package/@nodevisor/os) — OS detection (used to determine package manager)
- [`@nodevisor/docker`](https://www.npmjs.com/package/@nodevisor/docker) — Docker installation uses Packages internally
- [`@nodevisor/ssh`](https://www.npmjs.com/package/@nodevisor/ssh) — SSH server installation uses Packages internally

## Documentation

Full documentation available at [nodevisor.com/docs/packages/packages](https://nodevisor.com/docs/packages/packages)

## License

Nodevisor uses a single O'Saasy license across all packages and applications. See the full terms in [LICENSE](https://github.com/nodevisor/nodevisor/blob/main/LICENSE).
