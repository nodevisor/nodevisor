import { DockerCluster, Traefik, Express, adminSchema, runnerSchema, Redis } from 'nodevisor';
import { DockerRegistry } from '@nodevisor/docker';
import { z } from 'zod';

export const schema = z.object({
  nodes: z.array(z.string()).default(process.env.NODES ? process.env.NODES.split(',') : []),
  traefik: z
    .object({
      ssl: z
        .object({
          email: z.string(),
        })
        .optional(),
    })
    .default({
      ssl: {
        email: process.env.TRAEFIK_SSL_EMAIL ?? '',
      },
    }),
  express: z
    .object({
      port: z.number().optional(),
      domains: z.array(z.string()),
    })
    .default({
      port: Number(process.env.EXPRESS_PORT ?? 3000),
      domains: process.env.EXPRESS_DOMAINS ? process.env.EXPRESS_DOMAINS.split(',') : [],
    }),
  registry: z
    .object({
      url: z.string().min(1),
      username: z.string().min(1),
      password: z.string().min(1),
    })
    .default({
      url: process.env.REGISTRY_REPOSITORY ?? '',
      username: process.env.REGISTRY_USERNAME ?? '',
      password: process.env.REGISTRY_PASSWORD ?? '',
    }),
  admin: adminSchema.default({
    username: process.env.ADMIN_USERNAME ?? 'root',
    password: process.env.ADMIN_PASSWORD ?? '',
    publicKeyPath: process.env.ADMIN_PUBLIC_KEY_PATH ?? '',

    privateKeyPath: process.env.ADMIN_PRIVATE_KEY_PATH,
    passphrase: process.env.ADMIN_PASSPHRASE,
  }),
  runner: runnerSchema.default({
    username: process.env.RUNNER_USERNAME ?? 'runner',
    publicKeyPath: process.env.RUNNER_PUBLIC_KEY_PATH ?? '',
    privateKeyPath: process.env.RUNNER_PRIVATE_KEY_PATH,
    passphrase: process.env.RUNNER_PASSPHRASE,
  }),
});

export default async (config: z.infer<typeof schema>) => {
  const { express, traefik, admin, runner, nodes, registry } = schema.parse(config);

  const dockerRegistry = new DockerRegistry(registry);

  const proxy = new Traefik(traefik);

  const redis = new Redis();

  const web = new Express({
    ...express,
    name: 'express',
    proxy,
    dependencies: [redis],
    context: '.',
    registry: dockerRegistry,
    cpus: {
      min: 0.5,
    },
  });

  const cluster = new DockerCluster({
    name: 'express-example',
    dependencies: [web],
    users: [admin, runner],
    nodes,
  });

  return cluster;
};
