<p align="center">
  <img alt="Nodevisor Logo" width="150" src="https://github.com/nodevisor/logo/raw/main/nodevisor.png">
</p>

# @nodevisor/shell

> The foundation of Nodevisor — shell execution, SSH connections, command building, and the module system.

Part of [**Nodevisor**](https://nodevisor.com) — TypeScript Infrastructure Automation Platform

## Install

```bash
npm install @nodevisor/shell
```

## Quick Start

### Local Execution

```ts
import $ from '@nodevisor/shell';

// Execute a command with template literals
const hostname = await $`hostname`.text();

// Get output as JSON
const info = await $`cat package.json`.json();

// Get output as lines
const files = await $`ls -1`.lines();
```

### Remote Execution via SSH

```ts
import $ from '@nodevisor/shell';

const $remote = $.connect({
  host: '10.0.0.10',
  username: 'root',
});

const kernel = await $remote`uname -s`.text(); // "Linux"

// Switch user without creating a new connection
const $runner = $remote.as('runner');
await $runner`whoami`.text(); // "runner"
```

## Key API

### Shell Proxy (`$`)

- **Template literals** — `$\`command\`` executes commands with automatic variable escaping
- **`.connect(options)`** — Create an SSH connection for remote execution
- **`.as(user)`** — Switch execution user without new SSH connection

### Command Builder

Every template literal call returns a `CommandBuilder` supporting:

```ts
await $`hostname`.text();           // trimmed string
await $`cat config.json`.json();    // parsed JSON
await $`cat hosts`.lines();         // string array
await $`test -f /tmp/f`.noThrow().boolean(); // true/false
await $`sleep 100`.timeout(5000);   // timeout support
```

### Module System

Build reusable infrastructure modules:

```ts
import $, { Module } from '@nodevisor/shell';

class Hostname extends Module {
  async get() {
    return this.$`hostname`.trim().text();
  }
}

// Use locally or remotely
const name = await $(Hostname).get();
```

### Connections

- **`ShellConnection`** — Local execution via Node.js `child_process`
- **`SSHConnection`** — Remote execution via SSH (`ssh2`)

## Related Packages

- [`nodevisor`](https://www.npmjs.com/package/nodevisor) — Umbrella package that re-exports shell and all modules
- [`@nodevisor/os`](https://www.npmjs.com/package/@nodevisor/os) — OS detection and system commands
- [`@nodevisor/fs`](https://www.npmjs.com/package/@nodevisor/fs) — File system operations
- [`@nodevisor/packages`](https://www.npmjs.com/package/@nodevisor/packages) — Package manager abstraction

## Documentation

Full documentation available at [nodevisor.com/docs/packages/shell](https://nodevisor.com/docs/packages/shell)

## License

Nodevisor uses a single O'Saasy license across all packages and applications. See the full terms in [LICENSE](https://github.com/nodevisor/nodevisor/blob/main/LICENSE).
