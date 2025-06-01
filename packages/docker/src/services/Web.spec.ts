import Cluster from '../DockerCluster';
import ClusterNode from '../DockerNode';
import { ClusterUser } from '@nodevisor/cluster';
import Traefik from './Traefik';
import Web from './Web';
import { ClusterType } from '@nodevisor/cluster';

describe('Web', () => {
  it('should create a empty web proxy cluster with extra hosts', async () => {
    const setupUser = new ClusterUser({
      host: '127.0.0.1',
      username: 'root',
      password: 'root-password',
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

    const api = new Web({
      name: 'api',
      domains: ['api.example.com'],
      proxy,
    });

    const web = new Web({
      name: 'web',
      domains: ['web.example.com'],
      dependencies: [api],
      proxy,
    });

    const cluster = new Cluster({
      name: 'test',
      nodes: [primary],
      users: [setupUser, runnerUser],
      dependencies: [web],
    });

    const config = cluster.toCompose({ type: ClusterType.DOCKER_COMPOSE });

    const result = {
      services: {
        web: {
          networks: {
            test_web_network: {
              priority: 0,
            },
            test_api_network: {
              priority: 0,
            },
            test_traefik_network: {
              priority: 0,
            },
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
            replicas: 1,
          },
          labels: {
            'traefik.enable': 'true',
            'traefik.docker.network': 'test_traefik_network',
            'traefik.http.services.web.loadbalancer.server.port': '3000',
            'traefik.http.routers.web-http.rule': 'Host(`web.example.com`)',
            'traefik.http.routers.web-http.entrypoints': 'web',
            'traefik.http.routers.web-http.tls': 'false',
            'traefik.http.routers.web-http.service': 'web',
            'traefik.http.routers.web-https.rule': 'Host(`web.example.com`)',
            'traefik.http.routers.web-https.entrypoints': 'websecure',
            'traefik.http.routers.web-https.tls': 'true',
            'traefik.http.routers.web-https.tls.certresolver': 'certresolver',
            'traefik.http.routers.web-https.service': 'web',
          },
          depends_on: {
            api: {
              condition: 'service_started',
            },
            traefik: {
              condition: 'service_started',
            },
          },
        },
        api: {
          networks: {
            test_api_network: {
              priority: 0,
            },
            test_traefik_network: {
              priority: 0,
            },
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
            replicas: 1,
          },
          labels: {
            'traefik.enable': 'true',
            'traefik.docker.network': 'test_traefik_network',
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
          depends_on: {
            traefik: {
              condition: 'service_started',
            },
          },
        },
        traefik: {
          networks: {
            test_traefik_network: {
              priority: 0,
              aliases: ['web.example.com', 'api.example.com'],
            },
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
            '--providers.docker=true --providers.swarm=false --providers.docker.exposedbydefault=false --entrypoints.web.address=:80 --providers.docker.network=test_traefik_network --ping=true --ping.entryPoint=traefik --entrypoints.traefik.address=:8080 --entrypoints.websecure.address=:443 --certificatesresolvers.certresolver.acme.tlschallenge=true --certificatesresolvers.certresolver.acme.email=info@test.nodevisor.com --certificatesresolvers.certresolver.acme.storage=/letsencrypt/acme.json',
          volumes: [
            {
              type: 'bind',
              source: '/var/run/docker.sock',
              target: '/var/run/docker.sock',
              read_only: true,
            },
            {
              type: 'volume',
              source: 'test_traefik_letsencrypt_volume',
              target: '/letsencrypt',
            },
          ],
          ports: [
            {
              host_ip: '0.0.0.0',
              target: 80,
              published: 80,
              protocol: 'tcp',
              mode: 'host',
            },
            {
              host_ip: '0.0.0.0',
              target: 443,
              published: 443,
              protocol: 'tcp',
              mode: 'host',
            },
          ],
          healthcheck: {
            interval: '10s',
            timeout: '2s',
            retries: 3,
            start_period: '10s',
            test: 'traefik healthcheck --ping',
          },
        },
      },
      volumes: {
        test_traefik_letsencrypt_volume: {
          driver: 'local',
        },
      },
      networks: {
        test_web_network: {
          driver: 'bridge',
          attachable: true,
          name: 'test_web_network',
        },
        test_api_network: {
          driver: 'bridge',
          attachable: true,
          name: 'test_api_network',
        },
        test_traefik_network: {
          driver: 'bridge',
          attachable: true,
          name: 'test_traefik_network',
        },
      },
      name: 'test',
    };

    // console.log(JSON.stringify(config, null, 2));

    expect(config).toEqual(result);
    // await cluster.setup();
  });
});
