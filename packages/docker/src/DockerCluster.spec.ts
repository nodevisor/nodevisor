import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import $ from '@nodevisor/core';
import Cluster from './DockerCluster';
import ClusterNode from './DockerNode';
import { User } from '@nodevisor/core';
import Traefik from './services/Traefik';
import Whoami from './services/Whoami';
import Redis from './services/Redis';
import DockerClusterType from './constants/DockerClusterType';

describe('Cluster', () => {
  it('should create a empty cluster', async () => {
    const setup = new User({
      host: '127.0.0.1',
      username: 'root',
      password: 'root-password',
      privateKeyPath: '~/.ssh/id_rsa',
      passphrase: 'my-passphrase',
    });

    const runner = setup.clone({ username: 'runner' });

    const primary = new ClusterNode({
      host: '127.0.0.1',
    });

    const cluster = new Cluster({
      name: 'test',
      nodes: [primary],
      users: [setup, runner],
    });

    const config = await cluster.toCompose({ type: DockerClusterType.COMPOSE });

    const result = {
      name: 'test',
      services: {},
      networks: {},
      volumes: {},
    };

    expect(config).toEqual(result);
    // await cluster.setup();
  });

  it('should create a empty web proxy cluster', async () => {
    const setupUser = new User({
      host: '127.0.0.1',
      username: 'root',
      password: 'root-password',
      privateKeyPath: '~/.ssh/id_rsa',
      passphrase: 'my-passphrase',
    });

    const runnerUser = setupUser.clone({ username: 'runner' });

    const primary = new ClusterNode({
      host: '127.0.0.1',
    });

    const proxy = new Traefik({
      ssl: {
        email: 'info@test.nodevisor.com',
      },
    });

    const cluster = new Cluster({
      name: 'test',
      nodes: [primary],
      users: [setupUser, runnerUser],
      dependencies: [proxy],
    });

    const config = cluster.toCompose({ type: DockerClusterType.COMPOSE });

    const result = {
      name: 'test',
      services: {
        traefik: {
          volumes: [
            {
              read_only: true,
              source: '/var/run/docker.sock',
              target: '/var/run/docker.sock',
              type: 'bind',
            },
            {
              source: 'test_traefik_letsencrypt_volume',
              target: '/letsencrypt',
              type: 'volume',
            },
          ],
          deploy: {
            replicas: 1,
            resources: {
              limits: {
                cpus: '1',
                memory: '512mb',
              },
              reservations: {
                cpus: '0.5',
                memory: '128mb',
              },
            },
            placement: {
              constraints: ['node.role == manager'],
            },
          },
          image: 'traefik:3.1.7',
          command:
            '--providers.docker=true --providers.swarm=true --providers.docker.exposedbydefault=false --entrypoints.web.address=:80 --providers.docker.network=test_traefik_network --entrypoints.websecure.address=:443 --certificatesresolvers.certresolver.acme.tlschallenge=true --certificatesresolvers.certresolver.acme.email=info@test.nodevisor.com --certificatesresolvers.certresolver.acme.storage=/letsencrypt/acme.json',
          restart: 'unless-stopped',
          ports: [
            {
              target: 80,
              published: 80,
              protocol: 'tcp',
              mode: 'host',
            },
            {
              target: 443,
              published: 443,
              protocol: 'tcp',
              mode: 'host',
            },
          ],
          networks: {
            test_traefik_network: {
              priority: 0,
            },
          },
        },
      },
      volumes: {},
      networks: {
        test_traefik_network: {
          attachable: true,
          driver: 'overlay',
          name: 'test_traefik_network',
        },
      },
    };

    expect(config).toEqual(result);
    // await cluster.setup();
  });

  it('should create a base web proxy cluster with web service', async () => {
    const setupUser = new User({
      host: '127.0.0.1',
      username: 'root',
      password: 'root-password',
      privateKeyPath: '~/.ssh/id_rsa',
      passphrase: 'my-passphrase',
    });

    const runnerUser = setupUser.clone({ username: 'runner' });

    const primary = new ClusterNode({
      host: '127.0.0.1',
    });

    const proxy = new Traefik({
      ssl: {
        email: 'info@test.nodevisor.com',
      },
    });

    const web = new Whoami({
      proxy,
      domains: ['whoami.127.0.0.1.nip.io'],
    });

    const cluster = new Cluster({
      name: 'test',
      nodes: [primary],
      users: [setupUser, runnerUser],
      dependencies: [web],
    });

    const config = cluster.toCompose({ type: DockerClusterType.COMPOSE });

    // console.log(JSON.stringify(config, null, 2));

    const result = {
      name: 'test',
      services: {
        traefik: {
          volumes: [
            {
              read_only: true,
              source: '/var/run/docker.sock',
              target: '/var/run/docker.sock',
              type: 'bind',
            },
            {
              source: 'test_traefik_letsencrypt_volume',
              target: '/letsencrypt',
              type: 'volume',
            },
          ],
          deploy: {
            replicas: 1,
            resources: {
              limits: {
                cpus: '1',
                memory: '512mb',
              },
              reservations: {
                cpus: '0.5',
                memory: '128mb',
              },
            },
            placement: {
              constraints: ['node.role == manager'],
            },
          },
          image: 'traefik:3.1.7',
          command:
            '--providers.docker=true --providers.swarm=true --providers.docker.exposedbydefault=false --entrypoints.web.address=:80 --providers.docker.network=test_traefik_network --entrypoints.websecure.address=:443 --certificatesresolvers.certresolver.acme.tlschallenge=true --certificatesresolvers.certresolver.acme.email=info@test.nodevisor.com --certificatesresolvers.certresolver.acme.storage=/letsencrypt/acme.json',
          restart: 'unless-stopped',
          ports: [
            {
              target: 80,
              published: 80,
              protocol: 'tcp',
              mode: 'host',
            },
            {
              target: 443,
              published: 443,
              protocol: 'tcp',
              mode: 'host',
            },
          ],
          networks: { test_traefik_network: { priority: 0 } },
        },
        whoami: {
          image: 'traefik/whoami',
          labels: {
            'traefik.enable': 'true',
            'traefik.docker.network': 'test_traefik_network',
            'traefik.http.services.whoami.loadbalancer.server.port': '80',
            'traefik.http.routers.whoami-http.rule': 'Host(`whoami.127.0.0.1.nip.io`)',
            'traefik.http.routers.whoami-http.entrypoints': 'web',
            'traefik.http.routers.whoami-http.tls': 'false',
            'traefik.http.routers.whoami-http.service': 'whoami',
            'traefik.http.routers.whoami-https.rule': 'Host(`whoami.127.0.0.1.nip.io`)',
            'traefik.http.routers.whoami-https.entrypoints': 'websecure',
            'traefik.http.routers.whoami-https.tls': 'true',
            'traefik.http.routers.whoami-https.tls.certresolver': 'certresolver',
            'traefik.http.routers.whoami-https.service': 'whoami',
          },
          deploy: {
            replicas: 1,
            resources: {
              limits: {
                cpus: '1',
                memory: '512mb',
              },
              reservations: {
                cpus: '0.5',
                memory: '128mb',
              },
            },
          },
          depends_on: {
            traefik: { condition: 'service_started' },
          },
          networks: {
            test_traefik_network: {
              priority: 0,
            },
            test_whoami_network: { priority: 0 },
          },
        },
      },
      volumes: {},
      networks: {
        test_traefik_network: {
          attachable: true,
          driver: 'overlay',
          name: 'test_traefik_network',
        },
        test_whoami_network: {
          attachable: true,
          driver: 'overlay',
          name: 'test_whoami_network',
        },
      },
    };

    expect(config).toEqual(result);
    // await cluster.setup();
    //
  });

  it('should create a base web proxy cluster with web service without ssl for swarm', async () => {
    const setupUser = new User({
      host: '127.0.0.1',
      username: 'root',
      password: 'root-password',
      privateKeyPath: '~/.ssh/id_rsa',
      passphrase: 'my-passphrase',
    });

    const runnerUser = setupUser.clone({ username: 'runner' });

    const proxy = new Traefik({
      dashboard: {
        insecure: true,
      },
    });

    const redis = new Redis();

    const web = new Whoami({
      proxy,
      domains: ['whoami.127.0.0.1.nip.io'],
      dependencies: [redis],
    });

    const cluster = new Cluster({
      name: 'test',
      nodes: ['127.0.0.1'],
      users: [setupUser, runnerUser],
      dependencies: [web],
    });

    const config = cluster.toCompose();

    const result = {
      services: {
        traefik: {
          volumes: [
            {
              read_only: true,
              source: '/var/run/docker.sock',
              target: '/var/run/docker.sock',
              type: 'bind',
            },
          ],
          deploy: {
            replicas: 1,
            resources: {
              limits: {
                cpus: '1',
                memory: '512mb',
              },
              reservations: {
                cpus: '0.5',
                memory: '128mb',
              },
            },
            placement: {
              constraints: ['node.role == manager'],
            },
          },
          image: 'traefik:3.1.7',
          command:
            '--providers.docker=true --providers.swarm=true --providers.docker.exposedbydefault=false --entrypoints.web.address=:80 --providers.docker.network=test_traefik_network --api.dashboard=true --api.insecure=true',
          restart: 'unless-stopped',
          ports: [
            {
              target: 80,
              published: 80,
              protocol: 'tcp',
              mode: 'host',
            },
            {
              mode: 'host',
              protocol: 'tcp',
              published: 8080,
              target: 8080,
            },
          ],
          networks: { test_traefik_network: {} },
        },
        whoami: {
          image: 'traefik/whoami',
          labels: {
            'traefik.enable': 'true',
            'traefik.docker.network': 'test_traefik_network',
            'traefik.http.services.whoami.loadbalancer.server.port': '80',
            'traefik.http.routers.whoami-http.rule': 'Host(`whoami.127.0.0.1.nip.io`)',
            'traefik.http.routers.whoami-http.entrypoints': 'web',
            'traefik.http.routers.whoami-http.tls': 'false',
            'traefik.http.routers.whoami-http.service': 'whoami',
          },
          depends_on: ['redis', 'traefik'],
          deploy: {
            replicas: 1,
            resources: {
              limits: {
                cpus: '1',
                memory: '512mb',
              },
              reservations: {
                cpus: '0.5',
                memory: '128mb',
              },
            },
          },
          networks: {
            test_redis_network: {},
            test_traefik_network: {},
            test_whoami_network: {},
          },
        },
        redis: {
          command: 'redis-server',
          deploy: {
            replicas: 1,
            resources: {
              limits: {
                cpus: '1',
                memory: '512mb',
              },
              reservations: {
                cpus: '0.5',
                memory: '128mb',
              },
            },
          },
          image: 'redis:7.4.1',
          networks: {
            test_redis_network: {},
          },
          restart: 'unless-stopped',
          volumes: [
            {
              source: 'test_redis_data_volume',
              target: '/data',
              type: 'volume',
            },
          ],
        },
      },
      volumes: {},
      networks: {
        test_redis_network: {
          attachable: true,
          driver: 'overlay',
          name: 'test_redis_network',
        },
        test_traefik_network: {
          attachable: true,
          driver: 'overlay',
          name: 'test_traefik_network',
        },
        test_whoami_network: {
          attachable: true,
          driver: 'overlay',
          name: 'test_whoami_network',
        },
      },
    };

    expect(config).toEqual(result);
  });

  it('should create a base web proxy cluster with web service without ssl for compose', async () => {
    const setupUser = new User({
      host: '127.0.0.1',
      username: 'root',
      password: 'root-password',
      privateKeyPath: '~/.ssh/id_rsa',
      passphrase: 'my-passphrase',
    });

    const runnerUser = setupUser.clone({ username: 'runner' });

    const proxy = new Traefik({
      dashboard: {
        insecure: true,
      },
    });

    const redis = new Redis();

    const web = new Whoami({
      proxy,
      domains: ['whoami.127.0.0.1.nip.io'],
      dependencies: [redis],
    });

    const cluster = new Cluster({
      name: 'test',
      nodes: ['127.0.0.1'],
      users: [setupUser, runnerUser],
      dependencies: [web],
    });

    const config = cluster.toCompose({ type: DockerClusterType.COMPOSE });

    const result = {
      name: 'test',
      services: {
        traefik: {
          volumes: [
            {
              read_only: true,
              source: '/var/run/docker.sock',
              target: '/var/run/docker.sock',
              type: 'bind',
            },
          ],
          deploy: {
            replicas: 1,
            resources: {
              limits: {
                cpus: '1',
                memory: '512mb',
              },
              reservations: {
                cpus: '0.5',
                memory: '128mb',
              },
            },
            placement: {
              constraints: ['node.role == manager'],
            },
          },
          image: 'traefik:3.1.7',
          command:
            '--providers.docker=true --providers.swarm=true --providers.docker.exposedbydefault=false --entrypoints.web.address=:80 --providers.docker.network=test_traefik_network --api.dashboard=true --api.insecure=true',
          restart: 'unless-stopped',
          ports: [
            {
              target: 80,
              published: 80,
              protocol: 'tcp',
              mode: 'host',
            },
            {
              mode: 'host',
              protocol: 'tcp',
              published: 8080,
              target: 8080,
            },
          ],
          networks: { test_traefik_network: { priority: 0 } },
        },
        whoami: {
          image: 'traefik/whoami',
          labels: {
            'traefik.enable': 'true',
            'traefik.docker.network': 'test_traefik_network',
            'traefik.http.services.whoami.loadbalancer.server.port': '80',
            'traefik.http.routers.whoami-http.rule': 'Host(`whoami.127.0.0.1.nip.io`)',
            'traefik.http.routers.whoami-http.entrypoints': 'web',
            'traefik.http.routers.whoami-http.tls': 'false',
            'traefik.http.routers.whoami-http.service': 'whoami',
          },
          depends_on: {
            redis: {
              condition: 'service_started',
            },
            traefik: { condition: 'service_started' },
          },
          deploy: {
            replicas: 1,
            resources: {
              limits: {
                cpus: '1',
                memory: '512mb',
              },
              reservations: {
                cpus: '0.5',
                memory: '128mb',
              },
            },
          },
          networks: {
            test_redis_network: {
              priority: 0,
            },
            test_traefik_network: {
              priority: 0,
            },
            test_whoami_network: { priority: 0 },
          },
        },
        redis: {
          command: 'redis-server',
          deploy: {
            replicas: 1,
            resources: {
              limits: {
                cpus: '1',
                memory: '512mb',
              },
              reservations: {
                cpus: '0.5',
                memory: '128mb',
              },
            },
          },
          image: 'redis:7.4.1',
          networks: {
            test_redis_network: {
              priority: 0,
            },
          },
          restart: 'unless-stopped',
          volumes: [
            {
              source: 'test_redis_data_volume',
              target: '/data',
              type: 'volume',
            },
          ],
        },
      },
      volumes: {},
      networks: {
        test_redis_network: {
          attachable: true,
          driver: 'overlay',
          name: 'test_redis_network',
        },
        test_traefik_network: {
          attachable: true,
          driver: 'overlay',
          name: 'test_traefik_network',
        },
        test_whoami_network: {
          attachable: true,
          driver: 'overlay',
          name: 'test_whoami_network',
        },
      },
    };

    expect(config).toEqual(result);
    /*
    // await cluster.setup();

    const yaml = cluster.yaml();
    console.log(yaml);

    // safe to write to file
    const tempDir = os.tmpdir();
    const filePath = path.join(tempDir, 'docker-compose.yml');
    fs.writeFileSync(filePath, yaml);

    // run docker compose
    const runComposeResult = await $`docker compose -f ${filePath} up -d`.text();

    // curl
    const curlResult = await $`curl -s http://whoami.127.0.0.1.nip.io`.text();
    console.log(curlResult);
    expect(curlResult).toContain('Host: whoami.127.0.0.1.nip.io');
    expect(curlResult).toContain('X-Forwarded-Host: whoami.127.0.0.1.nip.io');
    */
  });

  it('should create a base web proxy cluster with web service without ssl', async () => {
    const setupUser = new User({
      host: '127.0.0.1',
      username: 'root',
      password: 'root-password',
      privateKeyPath: '~/.ssh/id_rsa',
      passphrase: 'my-passphrase',
    });

    const runnerUser = setupUser.clone({ username: 'runner' });

    const redis = new Redis();

    const proxy = new Traefik({
      dashboard: {
        insecure: true,
      },
    });

    const mainCluster = new Cluster({
      name: 'nodevisor',
      nodes: ['127.0.0.1'],
      users: [setupUser, runnerUser],
      dependencies: [proxy, redis],
    });

    const web = new Whoami({
      proxy: mainCluster.getDependency(proxy),
      domains: ['whoami.127.0.0.1.nip.io'],
      dependencies: [redis],
    });

    const appCluster = new Cluster({
      name: 'app',
      nodes: ['127.0.0.1'],
      users: [setupUser, runnerUser],
      dependencies: [web],
    });

    const nodevisorConfig = mainCluster.toCompose();

    const nodevisorResult = {
      services: {
        redis: {
          command: 'redis-server',
          deploy: {
            replicas: 1,
            resources: {
              limits: {
                cpus: '1',
                memory: '512mb',
              },
              reservations: {
                cpus: '0.5',
                memory: '128mb',
              },
            },
          },
          image: 'redis:7.4.1',
          networks: {
            nodevisor_redis_network: {},
          },
          restart: 'unless-stopped',
          volumes: [
            {
              source: 'nodevisor_redis_data_volume',
              target: '/data',
              type: 'volume',
            },
          ],
        },
        traefik: {
          networks: {
            nodevisor_traefik_network: {},
          },
          restart: 'unless-stopped',
          image: 'traefik:3.1.7',
          deploy: {
            resources: {
              limits: {
                cpus: '1',
                memory: '512mb',
              },
              reservations: {
                cpus: '0.5',
                memory: '128mb',
              },
            },
            replicas: 1,
            placement: {
              constraints: ['node.role == manager'],
            },
          },
          command:
            '--providers.docker=true --providers.swarm=true --providers.docker.exposedbydefault=false --entrypoints.web.address=:80 --providers.docker.network=nodevisor_traefik_network --api.dashboard=true --api.insecure=true',
          volumes: [
            {
              type: 'bind',
              source: '/var/run/docker.sock',
              target: '/var/run/docker.sock',
              read_only: true,
            },
          ],
          ports: [
            {
              target: 80,
              published: 80,
              protocol: 'tcp',
              mode: 'host',
            },
            {
              target: 8080,
              published: 8080,
              protocol: 'tcp',
              mode: 'host',
            },
          ],
        },
      },
      volumes: {},
      networks: {
        nodevisor_traefik_network: {
          driver: 'overlay',
          attachable: true,
          name: 'nodevisor_traefik_network',
        },
        nodevisor_redis_network: {
          attachable: true,
          driver: 'overlay',
          name: 'nodevisor_redis_network',
        },
      },
    };

    expect(nodevisorConfig).toEqual(nodevisorResult);

    const appConfig = appCluster.toCompose();

    const appResult = {
      services: {
        whoami: {
          networks: {
            app_whoami_network: {},
            app_redis_network: {},
            nodevisor_traefik_network: {},
          },
          image: 'traefik/whoami',
          deploy: {
            resources: {
              limits: {
                cpus: '1',
                memory: '512mb',
              },
              reservations: {
                cpus: '0.5',
                memory: '128mb',
              },
            },
            replicas: 1,
          },
          labels: {
            'traefik.enable': 'true',
            'traefik.docker.network': 'nodevisor_traefik_network',
            'traefik.http.services.whoami.loadbalancer.server.port': '80',
            'traefik.http.routers.whoami-http.rule': 'Host(`whoami.127.0.0.1.nip.io`)',
            'traefik.http.routers.whoami-http.entrypoints': 'web',
            'traefik.http.routers.whoami-http.tls': 'false',
            'traefik.http.routers.whoami-http.service': 'whoami',
          },
          depends_on: ['redis'],
        },
        redis: {
          networks: {
            app_redis_network: {},
          },
          restart: 'unless-stopped',
          image: 'redis:7.4.1',
          deploy: {
            resources: {
              limits: {
                cpus: '1',
                memory: '512mb',
              },
              reservations: {
                cpus: '0.5',
                memory: '128mb',
              },
            },
            replicas: 1,
          },
          command: 'redis-server',
          volumes: [
            {
              source: 'app_redis_data_volume',
              target: '/data',
              type: 'volume',
            },
          ],
        },
      },
      volumes: {},
      networks: {
        app_whoami_network: {
          driver: 'overlay',
          attachable: true,
          name: 'app_whoami_network',
        },
        app_redis_network: {
          driver: 'overlay',
          attachable: true,
          name: 'app_redis_network',
        },
        nodevisor_traefik_network: {
          external: true,
        },
      },
    };

    expect(appConfig).toEqual(appResult);
  });
});
