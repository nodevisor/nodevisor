import Cluster from './Cluster';
import ClusterNode from './ClusterNode';
import ClusterUser from './ClusterUser';
import Traefik from './services/Traefik';
import Web from './services/Web';

describe('Cluster', () => {
  it('should create a empty cluster', async () => {
    const setup = new ClusterUser({
      username: 'root',
      password: 'root-password',
      privateKeyPath: '~/.ssh/id_rsa',
      passphrase: 'my-passphrase',
    });

    const runner = setup.clone('runner');

    const primary = new ClusterNode({
      host: '127.0.0.1',
    });

    const cluster = new Cluster({
      name: 'test',
      nodes: [primary],
      users: [setup, runner],
    });

    const config = await cluster.getDockerComposeConfig();

    const result = {
      version: '3.8',
      services: {},
      volumes: {},
      networks: { 'test-backend': { driver: 'overlay', attachable: true } },
    };

    expect(config).toEqual(result);
    // await cluster.setup();
  });

  it('should create a base proxy cluster', async () => {
    const setupUser = new ClusterUser({
      username: 'root',
      password: 'root-password',
      privateKeyPath: '~/.ssh/id_rsa',
      passphrase: 'my-passphrase',
    });

    const runnerUser = setupUser.clone('runner');

    const primary = new ClusterNode({
      host: '127.0.0.1',
    });

    const proxy = new Traefik({
      ssl: {
        email: 'info@example.com',
      },
    });

    const cluster = new Cluster({
      name: 'test',
      nodes: [primary],
      users: [setupUser, runnerUser],
      services: [proxy],
    });

    const config = await cluster.getDockerComposeConfig();

    // console.log(JSON.stringify(config, null, 2));

    const result = {
      version: '3.8',
      services: {
        traefik: {
          volumes: {
            '/var/run/docker.sock': '/var/run/docker.sock:ro',
            'traefik-letsencrypt': '/letsencrypt',
          },
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
            placement: {
              constraints: ['node.role == manager'],
            },
          },
          image: 'traefik:v3.1',
          command:
            ' --providers.docker=true --providers.docker.swarmMode=true --providers.docker.exposedbydefault=false --entrypoints.web.address=:80 --entrypoints.websecure.address=:443 --certificatesresolvers.certresolver.acme.tlschallenge=true --certificatesresolvers.certresolver.acme.email=info@example.com --certificatesresolvers.certresolver.acme.storage=/letsencrypt/acme.json',
          restart: 'unless-stopped',
          labels: {},
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
          networks: ['test-backend', 'test-traefik'],
        },
      },
      volumes: {
        '/var/run/docker.sock': {
          driver: 'local',
        },
        'traefik-letsencrypt': {
          driver: 'local',
        },
      },
      networks: {
        'test-backend': {
          driver: 'overlay',
          attachable: true,
        },
      },
    };

    expect(config).toEqual(result);
    // await cluster.setup();
  });

  it('should create a base proxy cluster', async () => {
    const setupUser = new ClusterUser({
      username: 'root',
      password: 'root-password',
      privateKeyPath: '~/.ssh/id_rsa',
      passphrase: 'my-passphrase',
    });

    const runnerUser = setupUser.clone('runner');

    const primary = new ClusterNode({
      host: '127.0.0.1',
    });

    const proxy = new Traefik({
      ssl: {
        email: 'info@example.com',
      },
    });

    class API extends Web {}

    const web = new API({
      name: 'api',
      image: 'api-image',
      proxy,
      domains: ['api.example.com'],
    });

    const cluster = new Cluster({
      name: 'test',
      nodes: [primary],
      users: [setupUser, runnerUser],
      services: [proxy, web],
    });

    const config = await cluster.getDockerComposeConfig();

    // console.log(JSON.stringify(config, null, 2));

    const result = {
      version: '3.8',
      services: {
        traefik: {
          volumes: {
            '/var/run/docker.sock': '/var/run/docker.sock:ro',
            'traefik-letsencrypt': '/letsencrypt',
          },
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
            placement: {
              constraints: ['node.role == manager'],
            },
          },
          image: 'traefik:v3.1',
          command:
            ' --providers.docker=true --providers.docker.swarmMode=true --providers.docker.exposedbydefault=false --entrypoints.web.address=:80 --entrypoints.websecure.address=:443 --certificatesresolvers.certresolver.acme.tlschallenge=true --certificatesresolvers.certresolver.acme.email=info@example.com --certificatesresolvers.certresolver.acme.storage=/letsencrypt/acme.json',
          restart: 'unless-stopped',
          labels: {},
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
          networks: ['test-backend', 'test-traefik'],
        },
        api: {
          image: 'api-image',
          command: '',
          labels: {
            'traefik.enable': 'true',
            'traefik.http.services.api.loadbalancer.server.port': '3000',
            'traefik.http.routers.api-http.rule': 'Host(`api.example.com`)',
            'traefik.http.routers.api-http.entrypoints': 'web',
            'traefik.http.routers.api-http.tls': 'false',
            'traefik.http.routers.api-http.service': 'api',
            'traefik.http.routers.api-https.rule': 'Host(`api.example.com`)',
            'traefik.http.routers.api-https.entrypoints': 'websecure',
            'traefik.http.routers.api-https.tls': 'true',
            'traefik.http.routers.api-https.tls.certresolver': 'certresolver',
            'traefik.http.routers.api-https.service': 'api',
          },
          ports: [],
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
          },
          networks: ['test-backend', 'test-api'],
        },
      },
      volumes: {
        '/var/run/docker.sock': {
          driver: 'local',
        },
        'traefik-letsencrypt': {
          driver: 'local',
        },
      },
      networks: {
        'test-backend': {
          driver: 'overlay',
          attachable: true,
        },
      },
    };

    expect(config).toEqual(result);
    // await cluster.setup();
  });
});
