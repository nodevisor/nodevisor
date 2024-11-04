import { DockerCluster, Traefik, Web, adminSchema, runnerSchema } from 'nodevisor';
import { z } from 'zod';

export const schema = z
  .object({
    express: z
      .object({
        port: z.number(),
        domains: z.array(z.string()),
      })
      .default({
        port: process.env.EXPRESS_PORT ? Number(process.env.EXPRESS_PORT) : 3000,
        domains: process.env.EXPRESS_DOMAINS
          ? process.env.EXPRESS_DOMAINS.split(',')
          : ['express.127.0.0.1.nip.io'],
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
    nodes: z.array(z.string()),
  })
  .default({
    nodes: process.env.NODES ? process.env.NODES.split(',') : ['127.0.0.1'],
  });

export default async (config: z.infer<typeof schema>) => {
  const { express, admin, runner, nodes } = schema.parse(config);

  const proxy = new Traefik();

  const web = new Web({
    ...express,
    name: 'express',
    proxy,
  });

  const cluster = new DockerCluster({
    name: 'express-example',
    services: [web],
    users: [admin, runner],
    nodes: nodes,
  });

  return cluster;
};
