<p align="center">
  <img alt="Nodevisor Logo" width="150" src="https://github.com/nodevisor/logo/raw/main/nodevisor.png">
</p>

# @nodevisor/os

> Cross-platform operating system detection and system commands.

Part of [**Nodevisor**](https://nodevisor.com) — TypeScript Infrastructure Automation Platform

## Install

```bash
npm install @nodevisor/os
```

## Quick Start

```ts
import $ from '@nodevisor/shell';
import OS from '@nodevisor/os';

const os = $(OS);

const hostname = await os.hostname();
const arch = await os.arch();
const uptime = await os.uptime();
const hasDocker = await os.commandExists('docker');
```

### Remote Usage

```ts
const $server = $.connect({ host: '10.0.0.10', username: 'root' });
const hostname = await $server(OS).hostname();
```

## API

| Method | Description |
|--------|-------------|
| `hostname()` | Get the system hostname |
| `arch()` | Get the CPU architecture (`x64`, `arm64`, etc.) |
| `uptime()` | Get system uptime in seconds |
| `commandExists(cmd)` | Check if a command is available on the system PATH |
| `reboot()` | Reboot the system (cross-platform) |
| `shutdown()` | Shutdown the system (cross-platform) |

## Related Packages

- [`@nodevisor/shell`](https://www.npmjs.com/package/@nodevisor/shell) — Core shell execution
- [`@nodevisor/packages`](https://www.npmjs.com/package/@nodevisor/packages) — Package manager abstraction (uses OS for detection)
- [`@nodevisor/pwsh`](https://www.npmjs.com/package/@nodevisor/pwsh) — PowerShell wrapper (used internally for Windows)

## Documentation

Full documentation available at [nodevisor.com/docs/packages/os](https://nodevisor.com/docs/packages/os)

## License

Nodevisor uses a single O'Saasy license across all packages and applications. See the full terms in [LICENSE](https://github.com/nodevisor/nodevisor/blob/main/LICENSE).
