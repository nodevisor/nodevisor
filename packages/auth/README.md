<p align="center">
  <img alt="Nodevisor Logo" width="150" src="https://github.com/nodevisor/logo/raw/main/nodevisor.png">
</p>

# @nodevisor/auth

> Set and manage user passwords on remote systems.

Part of [**Nodevisor**](https://nodevisor.com) — TypeScript Infrastructure Automation Platform

## Install

```bash
npm install @nodevisor/auth
```

## Quick Start

```ts
import $ from '@nodevisor/shell';
import Auth from '@nodevisor/auth';

const $server = $.connect({ host: '10.0.0.10', username: 'root' });
const auth = $server(Auth);

// Set a user's password
await auth.setPassword('runner', 'super-secret-password');
```

### Create a User with Password

```ts
import $, { Users, Auth } from 'nodevisor';

const $server = $.connect({ host: '10.0.0.10', username: 'root' });

await $server(Users).add('runner');
await $server(Auth).setPassword('runner', process.env.RUNNER_PASSWORD!);
```

## API

| Method | Description |
|--------|-------------|
| `setPassword(username, password)` | Set or update a user's password (uses `chpasswd` on Linux) |
| `logout()` | Logout the current user session |

## Related Packages

- [`@nodevisor/users`](https://www.npmjs.com/package/@nodevisor/users) — Create and manage users
- [`@nodevisor/authorized-keys`](https://www.npmjs.com/package/@nodevisor/authorized-keys) — SSH key-based authentication
- [`@nodevisor/ssh`](https://www.npmjs.com/package/@nodevisor/ssh) — SSH server configuration

## Documentation

Full documentation available at [nodevisor.com/docs/packages/auth](https://nodevisor.com/docs/packages/auth)

## License

Nodevisor uses a single O'Saasy license across all packages and applications. See the full terms in [LICENSE](https://github.com/nodevisor/nodevisor/blob/main/LICENSE).
