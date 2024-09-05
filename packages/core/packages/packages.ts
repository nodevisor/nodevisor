import type Connection from '../Connection';

import * as util from './util';

export async function update(connection: Connection) {
  const { $ } = connection;

  return $`apt-get update`;
}

export async function upgrade(connection: Connection) {
  const { $ } = connection;

  return $`DEBIAN_FRONTEND=noninteractive apt-get upgrade -y`;
}

export async function install(connection: Connection, packages: string[] | string) {
  const { $ } = connection;

  /*
  if (await isInstalled(connection, name)) {
    return true;
  }
  */

  await $`DEBIAN_FRONTEND=noninteractive apt-get install -y ${packages}`;
  return true;
}

export async function uninstall(connection: Connection, name: string) {
  const { $ } = connection;

  if (!(await isInstalled(connection, name))) {
    return true;
  }

  await $`DEBIAN_FRONTEND=noninteractive apt-get remove -y ${name}`;
  return true;
}

export async function updateAndUpgrade(connection: Connection) {
  await update(connection);

  return upgrade(connection);
}

export async function isInstalled(connection: Connection, name: string) {
  const lines = await util.lines(connection)`apt-cache policy ${name} | grep Installed`;

  return !!lines.length;
}

// throw if package is not installed
export async function requireInstalled(connection: Connection, name: string) {
  if (!(await isInstalled(connection, name))) {
    throw new Error(`Package ${name} is not installed`);
  }
}

export async function isUpgradable(connection: Connection, name: string) {
  const lines = await util.lines(connection)`apt list --upgradable ${name}`;

  return !!lines.length;
}

// restart the service
export async function restart(connection: Connection, name: string) {
  const { $ } = connection;

  return $`systemctl restart ${name}`;
}
