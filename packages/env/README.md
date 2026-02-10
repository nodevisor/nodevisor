<p align="center">
  <img alt="Nodevisor Logo" width="150" src="https://github.com/nodevisor/logo/raw/main/nodevisor.png">
</p>

# @nodevisor/env

> Read and set environment variables on local and remote systems.

Part of [**Nodevisor**](https://nodevisor.com) — TypeScript Infrastructure Automation Platform

## Install

```bash
npm install @nodevisor/env
```

## Quick Start

```ts
import $ from '@nodevisor/shell';
import Env from '@nodevisor/env';

const env = $(Env);

// Get an environment variable
const home = await env.home();
console.log(home); // "/root"

// Set a variable
await env.set('NODE_ENV', 'production');

// Read it back
const nodeEnv = await env.get('NODE_ENV');
console.log(nodeEnv); // "production"

// Load from .env file
await env.load('/opt/app/.env');
```

## API

| Method | Description |
|--------|-------------|
| `get(name)` | Read an environment variable |
| `set(name, value)` | Set an environment variable |
| `unset(name)` | Remove an environment variable |
| `home()` | Get the home directory of the current user |
| `load(path)` | Load variables from a `.env` file |

## Related Packages

- [`@nodevisor/shell`](https://www.npmjs.com/package/@nodevisor/shell) — CommandBuilder env support
- [`@nodevisor/authorized-keys`](https://www.npmjs.com/package/@nodevisor/authorized-keys) — Uses Env to resolve home directory

## Documentation

Full documentation available at [nodevisor.com/docs/packages/env](https://nodevisor.com/docs/packages/env)

## License

Nodevisor uses a single O'Saasy license across all packages and applications. See the full terms in [LICENSE](https://github.com/nodevisor/nodevisor/blob/main/LICENSE).
