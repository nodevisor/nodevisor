import { Module, type Nodevisor, Platform } from '@nodevisor/core';

export default class FS extends Module {
  constructor(nodevisor: Nodevisor) {
    super(nodevisor, {
      name: 'fs',
    });
  }

  async exists(path: string) {
    switch (await this.platform()) {
      case Platform.WINDOWS:
        return this.$`powershell Test-Path ${path}`;
      default:
        return this.$`test -e ${path}`.boolean(true);
    }
  }

  async append(path: string, data: string) {
    return this.$`echo ${data} >> ${path}`;
  }

  async write(path: string, data: string) {
    return this.$`echo ${data} > ${path}`;
  }

  async read(path: string) {
    return this.$`cat ${path}`;
  }

  async rm(path: string) {
    if (await this.exists(path)) {
      await this.$`rm ${path}`;
    }
  }

  async mkdir(path: string) {
    return this.$`mkdir -p ${path}`;
  }

  async rmdir(path: string) {
    return this.$`rm -rf ${path}`;
  }

  async mv(source: string, destination: string) {
    return this.$`mv ${source} ${destination}`;
  }

  async chmod(path: string, mode: string) {
    return this.$`chmod ${mode} ${path}`;
  }

  async chown(path: string, owner: string) {
    return this.$`chown ${owner} ${path}`;
  }

  async chgrp(path: string, group: string) {
    return this.$`chgrp ${group} ${path}`;
  }

  async stat(path: string) {
    return this.$`stat ${path}`;
  }

  async temp() {
    return this.$`mktemp`;
  }

  async tempDir() {
    return this.$`mktemp -d`;
  }

  // get absolute path
  // todo move to path.resolve
  async abs(path: string) {
    return this.$`readlink -f ${path}`;
  }
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
