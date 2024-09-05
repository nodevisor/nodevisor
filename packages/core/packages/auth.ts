import type Connection from '../Connection';

import * as fs from './fs';
import * as sftp from './sftp';
import * as user from './user';

export async function logout(connection: Connection) {
  const { $ } = connection;
  return $`logout`;
}

export async function login(connection: Connection, username: string) {
  const { $ } = connection;
  if ((await user.whoami(connection)) === username) {
    return;
  }

  await $`su - ${}`;

  if ((await user.whoami(connection)) !== username) {
    throw new Error('Failed to login');
  }
}

export async function setPassword(connection: Connection, username: string, password: string) {
  const { $ } = connection;

  // generate a temp file on the remote machine
  const remotePath = await fs.temp(connection);

  try {
    await sftp.putContent(connection, `${username}:${password}`, remotePath);
    // await uploadContent(connection, remotePath, `${username}:${password}`);

    return await $`chpasswd < "${remotePath}"`;
  } finally {
    // remove the password file from the remote machine
    await fs.rm(connection, remotePath);
  }
}
