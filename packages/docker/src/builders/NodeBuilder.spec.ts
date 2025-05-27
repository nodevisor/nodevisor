import NodeBuilder from './NodeBuilder';

describe('NodeBuilder', () => {
  describe('initialization', () => {
    it('should initialize with default values', () => {
      const builder = new NodeBuilder();
      expect(builder.image).toBe('node:22-alpine');
      expect(builder.distDir).toBe('/dist');
      expect(builder.appDir).toBe('');
      expect(builder['buildCommand']).toBe('npm run build');
      expect(builder['startCommand']).toBe('npm run start');
    });

    it('should initialize with custom values', () => {
      const customBuilder = new NodeBuilder({
        node: 'node',
        version: '20-alpine',
        distDir: '/build',
        appDir: '/src',
        buildCommand: 'yarn build',
        startCommand: 'yarn start',
        dotEnv: { NODE_ENV: 'production' },
      });

      expect(customBuilder.image).toBe('node:20-alpine');
      expect(customBuilder.distDir).toBe('/build');
      expect(customBuilder.appDir).toBe('/src');
      expect(customBuilder['buildCommand']).toBe('yarn build');
      expect(customBuilder['startCommand']).toBe('yarn start');
      expect(customBuilder['dotEnv']).toEqual({ NODE_ENV: 'production' });
    });
  });

  describe('build process', () => {
    it('should generate correct Dockerfile stages', async () => {
      const builder = new NodeBuilder();

      const builderStage = builder.getBuilder();
      const runnerStage = builder.getRunner();

      expect(builderStage).toBeDefined();
      expect(runnerStage).toBeDefined();
    });

    it('should handle dotEnv configuration', async () => {
      const dotEnv = { NODE_ENV: 'production', API_KEY: 'secret' };
      const builder = new NodeBuilder({ dotEnv });

      const builderStage = builder.getBuilder();
      expect(builderStage.toString()).toContain('NODE_ENV=production');
      expect(builderStage.toString()).toContain('API_KEY=secret');
    });

    it('should copy correct files in runner stage', async () => {
      const builder = new NodeBuilder({
        distDir: '/build',
        appDir: '/apps/api',
      });

      const runnerStage = builder.getRunner();
      const dockerfileContent = runnerStage.toString();

      expect(dockerfileContent).toContain('COPY --from=builder /app/package*.json .');
      expect(dockerfileContent).toContain('COPY --from=builder /app/.npmrc .');
      expect(dockerfileContent).toContain(
        'COPY --from=builder /app/apps/api/package*.json ./apps/api',
      );
      expect(dockerfileContent).toContain(
        'COPY --from=builder /app/apps/api/build ./apps/api/build',
      );
    });
  });

  describe('Dockerfile content generation', () => {
    it('should generate complete Dockerfile with default configuration', async () => {
      const builder = new NodeBuilder();

      const content = await builder.getDockerfileContent();

      const expectedDockerfile = `FROM node:22-alpine AS builder
WORKDIR /app
COPY . .
WORKDIR /app
RUN npm ci --ignore-scripts
ENV NODE_ENV=production
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json .
COPY --from=builder /app/.npmrc .
COPY --from=builder /app/package*.json .
COPY --from=builder /app/dist ./dist
RUN npm ci --omit=dev --ignore-scripts
WORKDIR /app
CMD ["sh", "-c", "npm run start"]`;

      expect(content.trim()).toBe(expectedDockerfile.trim());
    });

    it('should generate Dockerfile with custom configuration', async () => {
      const builder = new NodeBuilder({
        node: 'node',
        version: '20-alpine',
        distDir: '/build',
        appDir: '/apps/api',
        buildCommand: 'yarn build',
        startCommand: 'yarn start',
        dotEnv: {
          NODE_ENV: 'production',
          API_URL: 'https://api.example.com',
        },
      });

      const content = await builder.getDockerfileContent();

      const expectedDockerfile = `FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
WORKDIR /app/apps/api
RUN echo "NODE_ENV=production
API_URL=https://api.example.com" > .env
WORKDIR /app
RUN npm ci --ignore-scripts
ENV NODE_ENV=production
RUN yarn build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json .
COPY --from=builder /app/.npmrc .
COPY --from=builder /app/apps/api/package*.json ./apps/api
COPY --from=builder /app/apps/api/build ./apps/api/build
COPY --from=builder /app/apps/api/.env ./apps/api/.env
RUN npm ci --omit=dev --ignore-scripts
WORKDIR /app/apps/api
CMD ["sh", "-c", "yarn start"]`;

      expect(content.trim()).toBe(expectedDockerfile.trim());
    });

    it('should handle .env file copying', async () => {
      const builder = new NodeBuilder({
        appDir: '/packages/ui',
        dotEnv: '.env',
      });

      const content = await builder.getDockerfileContent();

      const expectedDockerfile = `FROM node:22-alpine AS builder
WORKDIR /app
COPY . .
WORKDIR /app/packages/ui
ARG .env
RUN echo "$.env" > .env
WORKDIR /app
RUN npm ci --ignore-scripts
ENV NODE_ENV=production
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json .
COPY --from=builder /app/.npmrc .
COPY --from=builder /app/packages/ui/package*.json ./packages/ui
COPY --from=builder /app/packages/ui/dist ./packages/ui/dist
COPY --from=builder /app/packages/ui/.env ./packages/ui/.env
RUN npm ci --omit=dev --ignore-scripts
WORKDIR /app/packages/ui
CMD ["sh", "-c", "npm run start"]`;

      expect(content.trim()).toBe(expectedDockerfile.trim());
    });
  });
});
