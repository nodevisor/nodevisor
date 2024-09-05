import type Connection from '../Connection';

import * as util from './util';

export async function exists(connection: Connection, path: string) {
  return util.bool(connection)`test -f ${path}`;
}

export async function append(connection: Connection, path: string, data: string) {
  const { $ } = connection;

  return $`echo ${data} >> ${path}`;
}

export async function write(connection: Connection, path: string, data: string) {
  const { $ } = connection;

  return $`echo ${data} > ${path}`;
}

export async function read(connection: Connection, path: string) {
  const { $ } = connection;

  return $`cat ${path}`;
}

export async function rm(connection: Connection, path: string) {
  const { $ } = connection;

  if (await exists(connection, path)) {
    await $`rm ${path}`;
  }
}

export async function mkdir(connection: Connection, path: string) {
  const { $ } = connection;

  return $`mkdir -p ${path}`;
}

export async function rmdir(connection: Connection, path: string) {
  const { $ } = connection;

  return $`rm -rf ${path}`;
}

export async function mv(connection: Connection, source: string, destination: string) {
  const { $ } = connection;

  return $`mv ${source} ${destination}`;
}

export async function chmod(connection: Connection, path: string, mode: string) {
  const { $ } = connection;

  return $`chmod ${mode} ${path}`;
}

export async function chown(connection: Connection, path: string, owner: string) {
  const { $ } = connection;

  return $`chown ${owner} ${path}`;
}

export async function chgrp(connection: Connection, path: string, group: string) {
  const { $ } = connection;

  return $`chgrp ${group} ${path}`;
}

export async function stat(connection: Connection, path: string) {
  const { $ } = connection;

  return $`stat ${path}`;
}

export async function temp(connection: Connection) {
  const { $ } = connection;

  return $`mktemp`;
}

export async function tempDir(connection: Connection) {
  const { $ } = connection;

  return $`mktemp -d`;
}

// get absolute path
// todo move to path.resolve
export async function abs(connection: Connection, path: string) {
  const { $ } = connection;

  return $`readlink -f ${path}`;
}

/*
// copy file from local to remote and put content in the file
export async function uploadContent(connection: Connection, remotePath: string, content: string) {
  // create a temporary file on the local machine
  const localPath = await localTempFile(content);

  try {
    return await upload(connection, localPath, remotePath);
  } finally {
    // remove local file
    await fs.unlink(localPath);
  }
}

// upload temp content to remote
export async function uploadTempContent(connection: Connection, content: string) {
  // create a temporary file on the remote machine
  const remotePath = await temp(connection);

  try {
    await uploadContent(connection, remotePath, content);
    return remotePath;
  } catch (error) {
    // remove remote file
    await rm(connection, remotePath);
    throw error;
  }
}

// copy file from remote to local
export async function download(connection: Connection, remotePath: string, localPath: string) {
  return connection.download(remotePath, localPath);
}
*/
