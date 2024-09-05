import type Connection from '../Connection';
import raw from '../utils/raw';

import * as fs from './fs';

export async function get(connection: Connection, name: string) {
  const { $ } = connection;

  return $`echo $${raw(name)}`;
}

export async function set(connection: Connection, name: string, value: string) {
  const { $, execEnv } = connection;

  if (!connection.isOriginal()) {
    execEnv.set(name, value);
    return;
  }

  await $`export ${raw(name)}=${value}`;
}

export async function home(connection: Connection) {
  const value = await get(connection, 'HOME');

  if (!value) {
    throw new Error('HOME environment variable not set');
  }

  return value;
}

export async function load(connection: Connection, path: string) {
  const { $, execEnv } = connection;

  if (!connection.isOriginal()) {
    const absPath = await fs.abs(connection, path);
    execEnv.addFile(absPath);
    return;
  }

  await $`set -a`;
  await $`source ${path}`;
  await $`set +a`;
}
