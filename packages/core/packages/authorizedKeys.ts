import localfs from 'node:fs';

import type Connection from '../Connection';

import * as env from './env';
import * as fs from './fs';

export async function append(connection: Connection, publicKeyPath: string) {
  if (!localfs.existsSync(publicKeyPath)) {
    throw new Error(`Public key file not found: ${publicKeyPath}. Run: ssh-keygen -t rsa -b 4096`);
  }

  const publicKey = localfs.readFileSync(publicKeyPath, 'utf8');
  if (!publicKey) {
    throw new Error(`Public key file is empty: ${publicKeyPath}`);
  }

  // Append the public key to the authorized_keys file on the server
  const home = await env.home(connection);
  return fs.append(connection, `${home}/.ssh/authorized_keys`, publicKey.trim());
}

export async function write(connection: Connection, publicKeyPath: string) {
  if (!localfs.existsSync(publicKeyPath)) {
    throw new Error(`Public key file not found: ${publicKeyPath}. Run: ssh-keygen -t rsa -b 4096`);
  }

  const publicKey = localfs.readFileSync(publicKeyPath, 'utf8');
  if (!publicKey) {
    throw new Error(`Public key file is empty: ${publicKeyPath}`);
  }

  const home = await env.home(connection);

  // create .ssh directory if it doesn't exist
  await fs.mkdir(connection, `${home}/.ssh`);

  // Append the public key to the authorized_keys file on the server
  return fs.write(connection, `${home}/.ssh/authorized_keys`, publicKey.trim());
}
