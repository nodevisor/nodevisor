<p align="center">
  <img alt="Nodevisor Logo" width="150" src="https://github.com/nodevisor/logo/raw/main/nodevisor.png">
</p>

# @nodevisor/authorized-keys

> Manage SSH authorized_keys files for passwordless authentication.

Part of [**Nodevisor**](https://nodevisor.com) — TypeScript Infrastructure Automation Platform

## Install

```bash
npm install @nodevisor/authorized-keys
```

## Quick Start

```ts
import $ from '@nodevisor/shell';
import AuthorizedKeys from '@nodevisor/authorized-keys';

const $server = $.connect({ host: '10.0.0.10', username: 'root' });
const keys = $server(AuthorizedKeys);

// Write a public key (replaces existing keys)
await keys.write('ssh-ed25519 AAAA... user@machine');

// Or append to existing keys
await keys.append('ssh-ed25519 BBBB... another@machine');

// Add a key from a local file
await keys.appendFromFile('~/.ssh/id_ed25519.pub');
```

### Setup SSH Key Access for a New User

```ts
import $, { Users, AuthorizedKeys } from 'nodevisor';

const $server = $.connect({ host: '10.0.0.10', username: 'root' });

await $server(Users).add('runner');
const $runner = $server.as('runner');
await $runner(AuthorizedKeys).write(process.env.SSH_PUBLIC_KEY!);
```

## API

| Method | Description |
|--------|-------------|
| `write(publicKey)` | Replace authorized_keys with a single public key |
| `append(publicKey)` | Append a public key to authorized_keys |
| `writeFromFile(path, remotePath?)` | Read key from file and replace authorized_keys |
| `appendFromFile(path, remotePath?)` | Read key from file and append to authorized_keys |
| `readPublicKey(path, remotePath?)` | Read a public key from a file |
| `getAuthorizedKeysPath()` | Get the full path to the authorized_keys file |
| `ensureSSHDirectory()` | Create `~/.ssh` directory with proper permissions (0700) |

## Related Packages

- [`@nodevisor/ssh`](https://www.npmjs.com/package/@nodevisor/ssh) — SSH server hardening (disable password auth)
- [`@nodevisor/users`](https://www.npmjs.com/package/@nodevisor/users) — Create system users
- [`@nodevisor/fs`](https://www.npmjs.com/package/@nodevisor/fs) — Used internally for file operations

## Documentation

Full documentation available at [nodevisor.com/docs/packages/authorized-keys](https://nodevisor.com/docs/packages/authorized-keys)

## License

Nodevisor uses a single O'Saasy license across all packages and applications. See the full terms in [LICENSE](https://github.com/nodevisor/nodevisor/blob/main/LICENSE).
