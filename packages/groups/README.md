<p align="center">
  <img alt="Nodevisor Logo" width="150" src="https://github.com/nodevisor/logo/raw/main/nodevisor.png">
</p>

# @nodevisor/groups

> Manage system groups and user membership.

Part of [**Nodevisor**](https://nodevisor.com) — TypeScript Infrastructure Automation Platform

## Install

```bash
npm install @nodevisor/groups
```

## Quick Start

```ts
import $ from '@nodevisor/shell';
import Groups from '@nodevisor/groups';

const groups = $(Groups);

// Create a group
await groups.add('docker');

// Add a user to the group
await groups.addUser('runner', 'docker');

// Check membership
const userGroups = await groups.userGroups('runner');
console.log(userGroups); // ["runner", "docker"]
```

### Remote Usage

```ts
const $server = $.connect({ host: '10.0.0.10', username: 'root' });
await $server(Groups).addUser('runner', 'docker');
```

## API

| Method | Description |
|--------|-------------|
| `exists(name)` | Check if a group exists |
| `add(name)` | Create a new system group |
| `remove(name)` | Remove a system group |
| `addUser(username, group)` | Add a user to a group |
| `removeUser(username, group)` | Remove a user from a group |
| `userGroups(username)` | List all groups a user belongs to |
| `hasUser(username, group)` | Check if a user is a member of a group |

## Related Packages

- [`@nodevisor/users`](https://www.npmjs.com/package/@nodevisor/users) — Create and manage users
- [`@nodevisor/docker`](https://www.npmjs.com/package/@nodevisor/docker) — `Docker.allowUser()` uses Groups internally

## Documentation

Full documentation available at [nodevisor.com/docs/packages/groups](https://nodevisor.com/docs/packages/groups)

## License

Nodevisor uses a single O'Saasy license across all packages and applications. See the full terms in [LICENSE](https://github.com/nodevisor/nodevisor/blob/main/LICENSE).
