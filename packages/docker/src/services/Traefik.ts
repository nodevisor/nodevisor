import { ClusterBase, useCluster, type PartialFor, ClusterType } from '@nodevisor/cluster';
import type Web from './Web';
import WebProxy, { type WebProxyConfig } from './WebProxy';
import { Protocol } from '@nodevisor/endpoint';

type SSLConfig = {
  email: string;
  port?: number;
  storage?: string;
  redirect?: boolean;
};

type DashboardConfig =
  | {
      insecure: true;
      port?: 8080; // there is no ability to change this port
    }
  | {
      password: string;
      username?: string;
      host?: string;
    };

type TraefikConfig = PartialFor<WebProxyConfig, 'name'> & {
  ssl?: SSLConfig;
  dashboard?: DashboardConfig;
  dockerUnixSocket?: string;
  version?: string | number;
};

export default class Traefik extends WebProxy {
  readonly port = 8080;
  private ssl?: SSLConfig;
  private dashboard?: DashboardConfig;
  private dockerUnixSocket: string;

  constructor(config: TraefikConfig = {}) {
    const {
      ssl,
      name = 'traefik',
      version = '3.1.7',
      image = `traefik:${version}`,
      restart = 'unless-stopped',
      dashboard,
      dockerUnixSocket = '/var/run/docker.sock',
      ...rest
    } = config;

    super({
      name,
      image,
      restart,
      ...rest,
    });

    this.ssl = ssl;
    this.dashboard = dashboard;
    this.dockerUnixSocket = dockerUnixSocket;

    if (!rest.healthcheck) {
      this.healthcheck.set`traefik healthcheck --ping`;
      this.healthcheck.interval = '10s';
      this.healthcheck.timeout = '2s';
      this.healthcheck.retries = 3;
      this.healthcheck.startPeriod = '10s';
    }
  }

  getVolumes() {
    const { ssl, dockerUnixSocket, name } = this;
    const volumes = super.getVolumes();

    if (!volumes.find((volume) => volume.source === dockerUnixSocket)) {
      volumes.push({
        name: 'docker-socket',
        type: 'bind',
        source: dockerUnixSocket,
        target: '/var/run/docker.sock',
        read_only: true,
      });
    }

    if (ssl) {
      volumes.push({
        name: 'letsencrypt',
        type: 'volume',
        target: '/letsencrypt',
      });
    }

    return volumes;
  }

  getCommand() {
    const { ssl, dashboard } = this;
    const cb = super.getCommand();

    const { cluster, type } = useCluster();
    if (!cluster) {
      throw new Error('Cluster is not initialized. Use ClusterContext.run() to initialize it.');
    }

    cb.argument({
      '--providers.docker': true,
      '--providers.swarm': type === ClusterType.DOCKER_SWARM,
      // containers are not exposed by default without labels
      '--providers.docker.exposedbydefault': false,
      // default ports
      '--entrypoints.web.address': ':80',
      // https://doc.traefik.io/traefik/providers/docker/#network
      // use correct network for comunnication with web services
      '--providers.docker.network': this.getNetworkName(cluster),
    });

    if (this.healthcheck.isActive()) {
      cb.argument({
        '--ping': true,
        '--ping.entryPoint': 'traefik',
        '--entrypoints.traefik.address': ':8080',
      });
    }

    if (dashboard) {
      const insecure = 'insecure' in dashboard ? dashboard.insecure : false;

      cb.argument({
        '--api.dashboard': true,
        '--api.insecure': insecure,
      });
    }

    if (ssl) {
      const { email, port = 443, storage = '/letsencrypt/acme.json' /*, redirect */ } = ssl;

      cb.argument({
        '--entrypoints.websecure.address': `:${port}`,
        '--certificatesresolvers.certresolver.acme.tlschallenge': true,
        '--certificatesresolvers.certresolver.acme.email': email,
        '--certificatesresolvers.certresolver.acme.storage': storage,
      });
    }

    return cb;
  }

  getLabels() {
    const { ssl, dashboard, name } = this;

    let labels = super.getLabels();

    const routersPrefix = `traefik.http.routers.${name}`;
    /*
    labels = {
      ...labels,
      'traefik.http.routers.pingweb.rule': 'PathPrefix(`/ping`)',
      'traefik.http.routers.pingweb.service': 'ping@internal',
      'traefik.http.routers.pingweb.entrypoints': 'websecure',
    };

    /*
    - "traefik.http.routers.pingweb.rule=PathPrefix(`/ping`)"
    - "traefik.http.routers.pingweb.service=ping@internal"
    - "traefik.http.routers.pingweb.entrypoints=websecure"
    */

    // labels['traefik.docker.network'] = this.getNetworkName();

    if (dashboard) {
      if (!('insecure' in dashboard)) {
        const { username = 'admin', password, host } = dashboard;

        labels = {
          ...labels,

          // Secure Traefik dashboard router
          [`${routersPrefix}.entrypoints`]: 'websecure',
          [`${routersPrefix}.tls`]: true,
          [`${routersPrefix}.tls.certresolver`]: 'certresolver',

          // Basic auth
          'traefik.http.middlewares.traefik-auth.basicauth.users': `${username}:${password}`,
          [`${routersPrefix}.middlewares`]: 'traefik-auth',
        };

        if (host) {
          labels[`${routersPrefix}.rule`] = `Host(\`${host}\`)`;
        }
      }
    }

    if (ssl) {
      const { redirect } = ssl;

      if (redirect) {
        // Always Use HTTPS
        labels = {
          ...labels,
          'traefik.http.middlewares.redirect-to-https.redirectscheme.scheme': 'https',
          'traefik.http.middlewares.redirect-to-https.redirectscheme.permanent': true,
        };

        if (typeof redirect === 'boolean') {
          labels = {
            ...labels,
            'traefik.http.routers.http-catchall.rule': 'HostRegexp(`{host:.+}`)',
            'traefik.http.routers.http-catchall.entrypoints': 'web',
            'traefik.http.routers.http-catchall.middlewares': 'redirect-to-https',
          };
        }
      }
    }

    return labels;
  }

  getPorts() {
    const { ssl, dashboard } = this;
    const ports = super.getPorts();

    // Add default ports
    ports.push({
      target: 80,
      published: 80,
      protocol: Protocol.TCP,
      mode: 'host',
      host_ip: '0.0.0.0',
    });

    if (ssl) {
      const { port = 443 } = ssl;

      ports.push({
        target: port,
        published: port,
        protocol: Protocol.TCP,
        mode: 'host',
        host_ip: '0.0.0.0',
      });
    }

    if (dashboard) {
      if ('insecure' in dashboard) {
        const { port = 8080 } = dashboard;
        ports.push({
          target: port,
          published: port,
          protocol: Protocol.TCP,
          mode: 'host',
          host_ip: '127.0.0.1',
        });
      }
    }

    return ports;
  }

  getWebLabels(proxyCluster: ClusterBase, web: Web) {
    const { ssl } = this;
    const { port, domains, name } = web;

    const routersPrefix = `traefik.http.routers.${name}`;
    const servicesPrefix = `traefik.http.services.${name}`;

    const rule = domains.map((domain) => `Host(\`${domain}\`)`).join(' || ');

    let labels = {
      'traefik.enable': true,
      // https://doc.traefik.io/traefik/routing/providers/docker/#traefikdockernetwork
      // without it it will use random network
      [`traefik.docker.network`]: this.getNetworkName(proxyCluster),
      [`${servicesPrefix}.loadbalancer.server.port`]: port,

      // allow http traffic
      [`${routersPrefix}-http.rule`]: rule,
      [`${routersPrefix}-http.entrypoints`]: 'web',
      [`${routersPrefix}-http.tls`]: false,

      [`${routersPrefix}-http.service`]: name,
    };

    if (ssl) {
      labels = {
        ...labels,

        // allow https traffic
        [`${routersPrefix}-https.rule`]: rule,
        [`${routersPrefix}-https.entrypoints`]: 'websecure',
        [`${routersPrefix}-https.tls`]: true,
        [`${routersPrefix}-https.tls.certresolver`]: 'certresolver',

        [`${routersPrefix}-https.service`]: name,
      };
    }

    return labels;
  }
}
