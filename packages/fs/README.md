<p align="center">
  <img alt="Nodevisor Logo" width="150" src="https://github.com/nodevisor/logo/raw/main/nodevisor.png">
</p>

# @nodevisor/fs

> Cross-platform file system operations over local and remote connections.

Part of [**Nodevisor**](https://nodevisor.com) — TypeScript Infrastructure Automation Platform

## Install

```bash
npm install @nodevisor/fs
```

## Quick Start

```ts
import $ from '@nodevisor/shell';
import FS from '@nodevisor/fs';

const fs = $(FS);

// Create a temp file, write to it, read it back
const tmp = await fs.temp();
await fs.writeFile(tmp, 'hello world');
const content = await fs.readFile(tmp);
console.log(content); // "hello world"
await fs.rm(tmp);
```

### Remote Usage

```ts
const $server = $.connect({ host: '10.0.0.10', username: 'root' });
const fs = $server(FS);

await fs.writeFile('/var/www/index.html', '<h1>Hello</h1>');
const exists = await fs.exists('/etc/nginx/nginx.conf');
```

## API

| Method | Description |
|--------|-------------|
| `readFile(path, options?)` | Read file contents (uses SFTP for remote) |
| `writeFile(path, data, options?)` | Write content to a file |
| `appendFile(path, data, options?)` | Append content to a file |
| `rm(path)` / `unlink(path)` | Delete a file |
| `rmdir(path, options?)` | Remove a directory |
| `mkdir(path, options?)` | Create a directory |
| `exists(path)` | Check if a file or directory exists |
| `stat(path)` | Get file metadata |
| `chmod(path, mode)` | Change file permissions |
| `chown(path, owner)` | Change file ownership |
| `chgrp(path, group)` | Change file group |
| `mv(source, dest)` | Move or rename a file |
| `temp()` | Create a temporary file |
| `tempDir()` | Create a temporary directory |
| `abs(path)` | Resolve to absolute path |

## Related Packages

- [`@nodevisor/shell`](https://www.npmjs.com/package/@nodevisor/shell) — Core shell execution and connections
- [`@nodevisor/env`](https://www.npmjs.com/package/@nodevisor/env) — Environment variable management
- [`@nodevisor/authorized-keys`](https://www.npmjs.com/package/@nodevisor/authorized-keys) — Uses FS internally for key file management

## Documentation

Full documentation available at [nodevisor.com/docs/packages/fs](https://nodevisor.com/docs/packages/fs)

## License

Nodevisor uses a single O'Saasy license across all packages and applications. See the full terms in [LICENSE](https://github.com/nodevisor/nodevisor/blob/main/LICENSE).
