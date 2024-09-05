import { Writable } from 'node:stream';

import type Connection from '../Connection';
import * as temp from '../utils/temp';

import * as fs from './fs';

class InMemoryWriteStream extends Writable {
  constructor(options) {
    super(options);
    this.data = []; // Array to store the chunks of data
  }

  _write(chunk, encoding, callback) {
    console.log('data', chunk);
    this.data.push(chunk); // Store each chunk of data
    callback(); // Call the callback when the chunk is processed
  }

  getData() {
    // Combine all the chunks into a single Buffer
    return Buffer.concat(this.data);
  }
}

type PutOptions = {
  flags?: 'w' | 'a';
  encoding?: null | string;
  mode?: number;
};

type GetOptions = {
  flags?: 'r';
  encoding?: null | string;
  mode?: number;
  autoClose?: boolean;
};

// copy file from local to remote
export async function put(
  connection: Connection,
  localPath: string | Buffer,
  remotePath: string,
  options: PutOptions = {},
) {
  const { flags = 'w', encoding = null, mode = 0o644 } = options;

  // I need original connection for upload
  const originalConnection = connection.original();

  // create temp file for upload as main user
  const tempRemotePath = await fs.temp(originalConnection);

  const sftp = await originalConnection.getSFTP();

  try {
    // upload file to temp location as main user
    await sftp.put(localPath, tempRemotePath, {
      flags,
      encoding,
      mode,
    });

    // change owner of the file
    const { username } = connection;
    await fs.chown(originalConnection, tempRemotePath, username);

    // move file to the destination
    await fs.mv(connection, tempRemotePath, remotePath);
  } finally {
    await sftp.end();
    // remove temp file
    await fs.rm(originalConnection, tempRemotePath);
  }
}

export async function putContent(
  connection: Connection,
  content: string | Buffer,
  remotePath: string,
  options?: PutOptions,
) {
  const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);

  return put(connection, buffer, remotePath, options);
}

export async function putTempContent(
  connection: Connection,
  content: string | Buffer,
  options?: PutOptions,
) {
  // create a temporary file on the remote machine
  const remotePath = await fs.temp(connection);

  try {
    await putContent(connection, content, remotePath, options);
    return remotePath;
  } catch (error) {
    // remove remote file
    await fs.rm(connection, remotePath);
    throw error;
  }
}

export async function get(
  connection: Connection,
  remotePath: string,
  localPath: string,
  options: GetOptions = {},
) {
  // const tmp = await temp.file();

  const { flags = 'r', encoding = null, mode = 0o644, autoClose = true } = options;

  const sftp = await connection.getSFTP();

  try {
    await sftp.get(remotePath, localPath, {
      readStreamOptions: {
        flags,
        encoding,
        mode,
        autoClose,
      },
    });
  } finally {
    await sftp.end();
  }
}

export async function getContent(
  connection: Connection,
  remotePath: string,
  options: GetOptions = {},
) {
  const { flags = 'r', encoding = null, mode = 0o644, autoClose = true } = options;

  const sftp = await connection.getSFTP();

  try {
    const stream = new InMemoryWriteStream();

    await sftp.get(remotePath, stream, {
      readStreamOptions: {
        flags,
        encoding,
        mode,
        autoClose,
      },
    });

    const data = stream.getData();

    stream.destroy();

    return data;
  } finally {
    await sftp.end();
  }
}
