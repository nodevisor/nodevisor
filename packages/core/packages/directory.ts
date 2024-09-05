import type Connection from '../Connection';

export async function create(connection: Connection, path: string) {
  const { $ } = connection;

  return $`mkdir -p ${path}`;
}

export async function remove(connection: Connection, path: string) {
  const { $ } = connection;

  return $`rm -rf ${path}`;
}
