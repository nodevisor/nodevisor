<p align="center">
  <img alt="Nodevisor Logo" width="150" src="https://github.com/nodevisor/logo/raw/main/nodevisor.png">
</p>

# @nodevisor/users

> Create, remove, and check system users on Linux, macOS, and Windows.

Part of [**Nodevisor**](https://nodevisor.com) — TypeScript Infrastructure Automation Platform

## Install

```bash
npm install @nodevisor/users
```

## Quick Start

```ts
import $ from '@nodevisor/shell';
import Users from '@nodevisor/users';

const users = $(Users);

// Check current user
const me = await users.whoami(); // "root"

// Create a new user
if (!(await users.exists('runner'))) {
  await users.add('runner');
}

// Remove a user
await users.remove('olduser');
```

### Remote Usage

```ts
const $server = $.connect({ host: '10.0.0.10', username: 'root' });

await $server(Users).add('runner');

// Switch to the new user context
const $runner = $server.as('runner');
const whoami = await $runner`whoami`.text(); // "runner"
```

## API

| Method | Description |
|--------|-------------|
| `whoami()` | Get the username of the current user |
| `exists(username)` | Check if a user exists on the system |
| `add(username)` | Create a new system user |
| `remove(username)` | Remove a system user |

## Related Packages

- [`@nodevisor/auth`](https://www.npmjs.com/package/@nodevisor/auth) — Set user passwords
- [`@nodevisor/groups`](https://www.npmjs.com/package/@nodevisor/groups) — Manage group membership
- [`@nodevisor/authorized-keys`](https://www.npmjs.com/package/@nodevisor/authorized-keys) — Manage SSH keys for users

## Documentation

Full documentation available at [nodevisor.com/docs/packages/users](https://nodevisor.com/docs/packages/users)

## License

Nodevisor uses a single O'Saasy license across all packages and applications. See the full terms in [LICENSE](https://github.com/nodevisor/nodevisor/blob/main/LICENSE).
