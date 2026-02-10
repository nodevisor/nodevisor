<p align="center">
  <img alt="Nodevisor Logo" width="150" src="https://github.com/nodevisor/logo/raw/main/nodevisor.png">
</p>

# @nodevisor/pwsh

> Execute PowerShell commands for Windows-compatible automation.

Part of [**Nodevisor**](https://nodevisor.com) — TypeScript Infrastructure Automation Platform

## Install

```bash
npm install @nodevisor/pwsh
```

## Quick Start

```ts
import $ from '@nodevisor/shell';
import PWSH from '@nodevisor/pwsh';

const pwsh = $(PWSH);

// Run a PowerShell command
const version = await pwsh.command`$PSVersionTable.PSVersion.ToString()`.text();
console.log(version); // "7.4.1"

// Get system info
const hostname = await pwsh.command`hostname`.text();
```

## API

### `command(strings, ...values)`

Execute a PowerShell command via `pwsh -Command`. Automatically handles PowerShell-specific quoting.

```ts
const pwsh = $(PWSH);

// Template literal syntax
const result = await pwsh.command`Get-Process | Select-Object -First 5`.text();

// With variables (escaped for PowerShell)
const name = 'notepad';
const proc = await pwsh.command`Get-Process -Name ${name}`.text();
```

Returns a `CommandBuilder`, so you can chain output transforms:

```ts
const count = await pwsh.command`(Get-Process).Count`.trim().text();
```

## When It's Used

You typically don't use PWSH directly. It's used internally by:

- [`@nodevisor/os`](https://www.npmjs.com/package/@nodevisor/os) — Windows-specific system commands
- [`@nodevisor/fs`](https://www.npmjs.com/package/@nodevisor/fs) — Windows file operations

## Related Packages

- [`@nodevisor/os`](https://www.npmjs.com/package/@nodevisor/os) — Uses PWSH for Windows operations
- [`@nodevisor/shell`](https://www.npmjs.com/package/@nodevisor/shell) — PowerShell quote handling

## Documentation

Full documentation available at [nodevisor.com/docs/packages/pwsh](https://nodevisor.com/docs/packages/pwsh)

## License

Nodevisor uses a single O'Saasy license across all packages and applications. See the full terms in [LICENSE](https://github.com/nodevisor/nodevisor/blob/main/LICENSE).
