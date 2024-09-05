import debug from 'debug';

import type Connection from '../Connection';

import * as util from './util';

const log = debug('packages:user');

export async function exists(connection: Connection, username: string) {
  return util.bool(connection)`id -u ${username}`;
}

export async function add(connection: Connection, username: string) {
  const { $ } = connection;

  if (await exists(connection, username)) {
    log(`User ${username} already exists`);
    return true;
  }

  await $`adduser ${username}`;
  await exists(connection, username);
  return true;
}

export async function whoami(connection: Connection) {
  const { $ } = connection;

  return $`whoami`;
}

export async function remove(connection: Connection, username: string) {
  const { $ } = connection;

  if (!(await exists(connection, username))) {
    log(`User ${username} does not exist`);
    return true;
  }

  await $`deluser ${username}`;
  return !(await exists(connection, username));
}
