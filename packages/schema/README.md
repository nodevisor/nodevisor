<p align="center">
  <img alt="Nodevisor Logo" width="150" src="https://github.com/nodevisor/logo/raw/main/nodevisor.png">
</p>

# @nodevisor/schema

> Zod validation schemas for admin and runner user configuration with sensible defaults.

Part of [**Nodevisor**](https://nodevisor.com) — TypeScript Infrastructure Automation Platform

## Install

```bash
npm install @nodevisor/schema
```

Requires `zod >= 4` as a peer dependency.

## Quick Start

```ts
import { adminSchema, runnerSchema } from '@nodevisor/schema';

// Parse with all defaults
const admin = adminSchema.parse({});
// { username: 'root', publicKeyPath: '~/.ssh/nodevisor_id_ed25519.pub', ... }

const runner = runnerSchema.parse({});
// { username: 'runner', publicKeyPath: '~/.ssh/nodevisor_id_ed25519.pub', ... }

// Parse with overrides
const custom = adminSchema.parse({
  username: 'admin',
  privateKeyPath: '~/.ssh/id_ed25519',
  publicKeyPath: '~/.ssh/id_ed25519.pub',
});
```

## API

### `adminSchema`

Validates configuration for the admin user (typically `root`) who performs initial server setup.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `username` | `string` | `'root'` | SSH username for admin access |
| `password` | `string?` | — | Optional password authentication |
| `publicKeyPath` | `string` | `'~/.ssh/nodevisor_id_ed25519.pub'` | Path to SSH public key |
| `privateKeyPath` | `string` | `'~/.ssh/nodevisor_id_ed25519'` | Path to SSH private key |
| `passphrase` | `string?` | — | Passphrase for the private key |

### `runnerSchema`

Validates configuration for the deploy/runner user — a non-root user created during setup.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `username` | `string` | `'runner'` | SSH username for the deploy user |
| `publicKeyPath` | `string` | `'~/.ssh/nodevisor_id_ed25519.pub'` | Path to SSH public key |
| `privateKeyPath` | `string` | `'~/.ssh/nodevisor_id_ed25519'` | Path to SSH private key |
| `passphrase` | `string?` | — | Passphrase for the private key |

## Related Packages

- [`@nodevisor/cli`](https://www.npmjs.com/package/@nodevisor/cli) — Uses schemas for CLI input validation
- [`@nodevisor/cluster`](https://www.npmjs.com/package/@nodevisor/cluster) — ClusterUser accepts schema-validated config

## Documentation

Full documentation available at [nodevisor.com/docs/packages/schema](https://nodevisor.com/docs/packages/schema)

## License

Nodevisor uses a single O'Saasy license across all packages and applications. See the full terms in [LICENSE](https://github.com/nodevisor/nodevisor/blob/main/LICENSE).
