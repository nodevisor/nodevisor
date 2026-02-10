<p align="center">
  <img alt="Nodevisor Logo" width="150" src="https://github.com/nodevisor/logo/raw/main/nodevisor.png">
</p>

# @nodevisor/builder

> Abstract image builder interface for building and pushing container images.

Part of [**Nodevisor**](https://nodevisor.com) — TypeScript Infrastructure Automation Platform

## Install

```bash
npm install @nodevisor/builder
```

## Quick Start

```ts
import Builder from '@nodevisor/builder';

// Builder is abstract — use concrete implementations
// from @nodevisor/docker: DockerBuilder or NodeBuilder
```

### Configuration

```ts
new Builder({
  arch: 'amd64',            // Target architecture: 'amd64' | 'arm64'
  context: './apps/api',     // Build context path
  args: { NODE_ENV: 'production' }, // Build arguments
  tags: ['latest', 'v1.0'], // Image tags
});
```

## API

### Abstract Method

#### `build(image, registry, config)`

Build and optionally push an image. Returns an array of built tags.

```ts
const tags = await builder.build('myapp', registry, {
  push: true,
  context: './apps/api',
  labels: { version: '1.0' },
});
```

### Implementations

| Class | Package | Description |
|-------|---------|-------------|
| `DockerBuilder` | `@nodevisor/docker` | Builds from an existing Dockerfile |
| `NodeBuilder` | `@nodevisor/docker` | Multi-stage Node.js builder (generates Dockerfile) |

## Related Packages

- [`@nodevisor/docker`](https://www.npmjs.com/package/@nodevisor/docker) — Concrete builder implementations
- [`@nodevisor/registry`](https://www.npmjs.com/package/@nodevisor/registry) — Builders push to registries
- [`@nodevisor/cluster`](https://www.npmjs.com/package/@nodevisor/cluster) — Services use builders for image creation

## Documentation

Full documentation available at [nodevisor.com/docs/packages/builder](https://nodevisor.com/docs/packages/builder)

## License

Nodevisor uses a single O'Saasy license across all packages and applications. See the full terms in [LICENSE](https://github.com/nodevisor/nodevisor/blob/main/LICENSE).
