<p align="center">
  <img alt="Nodevisor Logo" width="150" src="https://github.com/nodevisor/logo/raw/main/nodevisor.png">
</p>

# @nodevisor/firewall

> High-level firewall abstraction (delegates to UFW).

Part of [**Nodevisor**](https://nodevisor.com) — TypeScript Infrastructure Automation Platform

## Install

```bash
npm install @nodevisor/firewall
```

## Status

This package is a high-level abstraction layer for firewall management. Currently delegates to [`@nodevisor/ufw`](https://www.npmjs.com/package/@nodevisor/ufw).

For firewall functionality, use `@nodevisor/ufw` directly:

```ts
import $ from '@nodevisor/shell';
import UFW from '@nodevisor/ufw';
import { endpoints } from '@nodevisor/endpoint';

const $server = $.connect({ host: '10.0.0.10', username: 'root' });
const ufw = $server(UFW);

await ufw.install();
await ufw.allow([endpoints.ssh, endpoints.web, endpoints.webSecure]);
await ufw.start();
```

## Related Packages

- [`@nodevisor/ufw`](https://www.npmjs.com/package/@nodevisor/ufw) — UFW firewall management
- [`@nodevisor/endpoint`](https://www.npmjs.com/package/@nodevisor/endpoint) — Network endpoint definitions

## Documentation

Full documentation available at [nodevisor.com/docs/packages/firewall](https://nodevisor.com/docs/packages/firewall)

## License

Nodevisor uses a single O'Saasy license across all packages and applications. See the full terms in [LICENSE](https://github.com/nodevisor/nodevisor/blob/main/LICENSE).
