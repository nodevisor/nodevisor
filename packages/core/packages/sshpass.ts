import Connection from '../Connection';

import * as packages from './packages';

export async function install(connection: Connection) {
  return packages.install(connection, 'sshpass');
}
