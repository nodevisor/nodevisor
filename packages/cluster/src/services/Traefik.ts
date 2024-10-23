import WebProxy, { type WebProxyConfig } from './WebProxy';
import type PartialFor from '../@types/PartialFor';
import type Web from './Web';
import type Labels from '../@types/Labels';
import toDockerLabels from '../utils/toDockerLabels';

type SSLConfig = {
  email: string;
  port?: number;
  storage?: string;
  redirect?: boolean;
};

type DashboardConfig = {
  port?: number;
  username?: string;
  password: string;
  host: string;
};

type TraefikConfig = PartialFor<WebProxyConfig, 'name' | 'image'> & {
  ssl?: SSLConfig;
  dashboard?: DashboardConfig;
};

export default class Traefik extends WebProxy {
  private ssl?: SSLConfig;
  private dashboard?: DashboardConfig;

  constructor(config: TraefikConfig) {
    const { ssl, dashboard, ...rest } = config;

    super({
      restart: 'unless-stopped',
      name: 'traefik',
      image: 'traefik:v3.1',
      ...rest,
    });

    this.ssl = ssl;
    this.dashboard = dashboard;
  }

  getDockerLabels() {
    const { ssl, dashboard, name } = this;

    let labels: Labels = {};
    const dockerLabels = super.getDockerLabels();

    const routersPrefix = `traefik.http.routers.${name}`;

    if (dashboard) {
      const { username = 'admin', password, host } = dashboard;

      labels = {
        ...labels,

        // Secure Traefik dashboard router
        [`${routersPrefix}.rule`]: `Host(\`${host}\`)`,
        [`${routersPrefix}.entrypoints`]: 'websecure',
        [`${routersPrefix}.tls`]: true,
        [`${routersPrefix}.tls.certresolver`]: 'certresolver',

        // Basic auth
        'traefik.http.middlewares.traefik-auth.basicauth.users': `${username}:${password}`,
        [`${routersPrefix}.middlewares`]: 'traefik-auth',
      };
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

    return {
      ...dockerLabels,
      ...toDockerLabels(labels),
    };
  }

  getDockerCommandBuilder() {
    const { ssl, dashboard } = this;

    const cb = super.getDockerCommandBuilder();

    cb.argument({
      '--providers.docker': true,
      '--providers.docker.swarmMode': true,
      // containers are not exposed by default without labels
      '--providers.docker.exposedbydefault': false,
      // default ports
      '--entrypoints.web.address': ':80',
    });

    if (dashboard) {
      const { username = 'admin', password, host } = dashboard;

      cb.argument({
        '--api.dashboard': true,
        '--api.insecure': false,
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

  getDockerPorts() {
    const { ssl } = this;
    const ports = super.getDockerPorts();

    ports.push({
      target: 80,
      published: 80,
      protocol: 'tcp',
      mode: 'host',
    });

    if (ssl) {
      const { port = 443 } = ssl;

      ports.push({
        target: port,
        published: port,
        protocol: 'tcp',
        mode: 'host',
      });
    }

    return ports;
  }

  getDockerConfig() {
    const { ssl } = this;
    const { volumes = {}, deploy = {}, ...rest } = super.getDockerConfig();

    if (!volumes['/var/run/docker.sock']) {
      volumes['/var/run/docker.sock'] = '/var/run/docker.sock:ro';
    }

    if (ssl) {
      volumes['traefik-letsencrypt'] = '/letsencrypt';
    }

    deploy.placement = {
      constraints: ['node.role == manager'],
    };

    return {
      volumes,
      deploy,
      ...rest,
    };
  }

  getWebLabels(web: Web) {
    const { ssl } = this;
    const { port, domains, name } = web;

    const routersPrefix = `traefik.http.routers.${name}`;
    const servicesPrefix = `traefik.http.services.${name}`;

    const rule = domains.map((domain) => `Host(\`${domain}\`)`).join(' || ');

    let labels = {
      'traefik.enable': true,
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
