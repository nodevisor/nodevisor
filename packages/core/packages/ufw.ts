import type Service from '../@types/Service';
import type Connection from '../Connection';
import Protocol from '../constants/Protocol';

import * as packages from './packages';

const name = 'ufw';

export async function install(
  connection: Connection,
  options: {
    allow?: Service[];
    enable?: boolean;
  } = {},
) {
  const { allow: allowServices, enable: enableService } = options;

  const response = await packages.install(connection, name);

  if (allowServices) {
    allowServices.reduce(async (promise, service) => {
      await promise;
      await allowService(connection, service);
    }, Promise.resolve());
  }

  if (enableService) {
    await enable(connection);
  }

  return response;
}

export async function allow(
  connection: Connection,
  port: number,
  protocol: Protocol = Protocol.TCP,
) {
  const { $ } = connection;
  packages.requireInstalled(connection, name);

  return $`${name} allow ${port}/${protocol}`;
}

export async function deleteAllow(
  connection: Connection,
  port: number,
  protocol: 'tcp' | 'udp' = 'tcp',
) {
  const { $ } = connection;
  packages.requireInstalled(connection, name);

  return $`${name} delete allow ${port}/${protocol}`;
}
/*
sudo ufw status
Firewall loaded

To                         Action  From
--                         ------  ----
22:tcp                     DENY    192.168.0.1
22:udp                     DENY    192.168.0.1
22:tcp                     DENY    192.168.0.7
22:udp                     DENY    192.168.0.7
22:tcp                     ALLOW   192.168.0.0/24
*/
export async function isAllowed(
  connection: Connection,
  port: number,
  protocol: 'tcp' | 'udp' = 'tcp',
) {
  const { $ } = connection;

  // const status = await $`${name} status`;

  // select line with ${port}:${protocol} and verify allow, allow can be more spaces after
}

export async function enable(connection: Connection) {
  const { $ } = connection;

  await $`yes | ${name} enable`;

  if (!(await isActive(connection))) {
    throw new Error('Failed to enable ufw');
  }
}

export async function isActive(connection: Connection) {
  const { $ } = connection;

  const status = await $`${name} status`;

  return status.startsWith('Status: active');
}

export async function allowService(connection: Connection, service: Service) {
  return allow(connection, service.port, service.protocol);
}
