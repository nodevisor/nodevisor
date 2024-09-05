import type Connection from '../Connection';

import * as packages from './packages';

const name = 'htop';

export async function install(connection: Connection) {
  return packages.install(connection, name);
}
