import { Server as ServerOG, type Connection } from 'ssh2';
import fs from 'fs/promises';
import { nanoid } from 'nanoid';
import { ShellConnection } from '../connections';
import log from './log';
import { Readable } from 'stream';

enum STATUS_CODE {
  OK = 0,
  EOF = 1,
  NO_SUCH_FILE = 2,
  PERMISSION_DENIED = 3,
  FAILURE = 4,
  BAD_MESSAGE = 5,
  NO_CONNECTION = 6,
  CONNECTION_LOST = 7,
  OP_UNSUPPORTED = 8,
}

const logServer = log.extend('server');
const logExec = logServer.extend('exec');

type ServerOptions = {
  username: string;
  password: string;
  port?: number;
  hostname?: string;
};

export default class Server {
  private server: ServerOG;
  private options: ServerOptions;

  constructor(options: ServerOptions) {
    this.options = options;

    const HOST_KEY = `-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABFwAAAAdzc2gtcn
NhAAAAAwEAAQAAAQEAypd2R8ZGpzRwCtURRjysENU8BYkSSnGiskacY5cx6lOEKARXPHb1
ymqfuLj4nQRoj3hvnkn5d4nFARN5D/7SFOS0C/H7B7HdfPTog9k+wN1IgPrrMIm3R9cjVg
PkRvSouBKyaIlemPIVTaNT8LRp7hyBAvYh97+nB+H6slEpKKCS6hXuHVOAZMuPxUKWNL66
KH92lfxgtdiM6rUpo+2jJrfjuVzfRAYNXbz91RLpJ9z+EvfK+pTf8LhRKNNRpndwQa1wpf
Pl3Q1F26jPvTojPjBxAS9HRR4EPjD/gLkIhfZzYPoM3qpvSb3SdkmOBTzVUnYQYWxNoRxS
S/biRIlDqQAAA9jvcu1d73LtXQAAAAdzc2gtcnNhAAABAQDKl3ZHxkanNHAK1RFGPKwQ1T
wFiRJKcaKyRpxjlzHqU4QoBFc8dvXKap+4uPidBGiPeG+eSfl3icUBE3kP/tIU5LQL8fsH
sd189OiD2T7A3UiA+uswibdH1yNWA+RG9Ki4ErJoiV6Y8hVNo1PwtGnuHIEC9iH3v6cH4f
qyUSkooJLqFe4dU4Bky4/FQpY0vroof3aV/GC12IzqtSmj7aMmt+O5XN9EBg1dvP3VEukn
3P4S98r6lN/wuFEo01Gmd3BBrXCl8+XdDUXbqM+9OiM+MHEBL0dFHgQ+MP+AuQiF9nNg+g
zeqm9JvdJ2SY4FPNVSdhBhbE2hHFJL9uJEiUOpAAAAAwEAAQAAAQEAv+YkdexMdIlpL/mP
OVazLeatyhiCqN1m3TOhY3yOHYYqgrVJ5M5SGABTduhPJnxMhsnwAKHVmfN4FoLZg9s+J+
hS25XE0Q8b3AcoT+vyU0HIMdR7/ygT4grZP9rD2qpZPrMHJ5onbvywTTBOjIx4YsHBOorm
tgRmNUNK8qmKMR3pSG9iRANQ3WveoncQ7XHhLegO2Nr48VOeGZCHu9wYEsahulw3Dr0RD8
piedbwUASIdiOFlnS9WHCW2ewdGY8bUjIGkUOU2HPiVrpXe3uiXq+4NBZFD9RfY6ooj2GM
+7X8f3+lhjYXNegVKkXHbmLsPUtIVQNEKW4d2oRQN90JWQAAAIAQ7nkVMXCg/3t9121J8P
8OnUQxr4M6vAQQCZB/nHxZ6nGgRiMvhh1+dpp41pvAFhQsy39tG0L6Gg7a+y9V558+KjaU
5gFSbp5MthxEy7fXZUHPfa7BaQZw6F0socaqUrti8eY5i4arHRcK088MYbQAluvSkLgdF0
jaL8UQWlpFUwAAAIEA6AIuryl6IUvDh1qlSDJYk8i0gt3yYVKG4vCvSiuhC4wLRbhJd42c
mz2tPZVWSV99I6VID0gkFfNJhrWuy3rlmxQH2L2iSIL2xr2jX0dO54P7Epx6jTZhoPlQSD
h7j2GS8TiVP0gk3WaSysJhL/edGFkUwDwjqgpRss8KKDUwGLcAAACBAN+Ki4MhYuXnOHaL
5ScgrmOKONdTm5H01sJgbpBQs+csn1pT7I+YLORgfqgS9mgl6o15idgtKBYi0d+LlbgrRZ
qdRhT+r5i7qcwIXkY3eJUybSkhb5To2Szoi/pvz+SWe7TPGG76tUCMdoqgBuB3CUXko6BD
MQd/p9Q2fR/Rt2afAAAAInNlZWRlbkBabGF0a29zLU1hY0Jvb2stUHJvLTIubG9jYWw=
-----END OPENSSH PRIVATE KEY-----`;

    this.server = new ServerOG(
      {
        hostKeys: [HOST_KEY],
      },
      (client) => this.prepareServer(client),
    );
  }

  get listening() {
    return this.server.listening;
  }

  async listen() {
    const { port = 22, hostname = '127.0.0.1' } = this.options;

    return new Promise<void>((resolve, reject) => {
      this.server.on('error', (e: Error & { code: string }) => {
        logServer(`Error: ${e.message}`);

        if (e.code === 'EADDRINUSE') {
          reject(new Error(`Port ${port} is already in use`));
        }
      });

      this.server.listen(port, hostname, () => {
        logServer(`Listening on ${hostname}:${port}`);
        resolve();
      });
    });
  }

  isAllowed(username: string, password: string) {
    return username === this.options.username && password === this.options.password;
  }

  prepareServer(client: Connection) {
    client.on('authentication', (ctx) => {
      const { method } = ctx;
      if (method === 'none') {
        // Respond with supported methods, typically reject but list supported methods
        ctx.reject(['password', 'publickey'], true); // 'true' to indicate partial success as per protocol
        return;
      }

      if (method === 'password') {
        const { username, password } = ctx;
        if (this.isAllowed(username, password)) {
          ctx.accept();
        } else {
          ctx.reject();
        }

        return;
      }

      throw new Error('Unsupported authentication method');
    });

    client.on('ready', () => {
      logServer('Client authenticated!');
      client.on('session', (accept, reject) => {
        const session = accept();

        const shell = new ShellConnection();

        session.on('exec', async (accept, reject, info) => {
          const stream = accept();

          let stdin = '';
          let hasStdin = false;
          stream.stdin.on('data', (data: Buffer) => {
            stdin += data.toString();
            hasStdin = true;
          });

          stream.stdin.on('end', async () => {
            try {
              logExec(info.command);
              logExec(`stdin: ${stdin}`);
              const response = await shell.exec(info.command, {
                stdin: hasStdin ? stdin : undefined,
              });

              stream.stderr.write(response.stderr);
              stream.stdout.write(response.stdout);
              stream.exit(response.code || 0);
            } catch (error) {
              stream.stderr.write(`Error executing command: ${(error as Error).message}\n`);
              stream.exit(1); // Indicate failure in execution
            } finally {
              stream.end();
            }
          });
        });

        session.on('sftp', (accept, reject) => {
          const sftpStream = accept();

          const files: Map<string, { filename: string; mode: 'r' | 'w' }> = new Map();

          sftpStream.on('OPEN', async (reqid, filename, flags, attrs) => {
            let mode: 'r' | 'w';

            // Determine the mode based on flags
            if (flags & fs.constants.O_WRONLY || flags & fs.constants.O_RDWR) {
              mode = 'w'; // Open file for writing
            } else if (flags & fs.constants.O_RDONLY) {
              mode = 'r'; // Open file for reading
            } else {
              // Unsupported flags
              sftpStream.status(reqid, STATUS_CODE.FAILURE);
              return;
            }

            // Create a unique handle using nanoid
            const handle = nanoid(8);
            files.set(handle, { filename, mode }); // Store the file and its mode in the map

            // Respond with the handle
            sftpStream.handle(reqid, Buffer.from(handle, 'utf8'));
          });

          sftpStream.on('WRITE', async (reqid, handle, offset, data) => {
            const fileInfo = files.get(handle.toString('utf8'));
            if (!fileInfo || fileInfo.mode !== 'w') {
              sftpStream.status(reqid, STATUS_CODE.FAILURE);
              return;
            }

            try {
              // Write data to the file at the specified offset
              const fileHandle = await fs.open(fileInfo.filename, 'r+');
              await fileHandle.write(data, 0, data.length, offset);
              await fileHandle.close();

              sftpStream.status(reqid, STATUS_CODE.OK);
            } catch (err) {
              console.error('Write error:', err);
              sftpStream.status(reqid, STATUS_CODE.FAILURE);
            }
          });

          sftpStream.on('READ', async (reqid, handle, offset, length) => {
            const fileInfo = files.get(handle.toString('utf8'));
            if (!fileInfo) {
              sftpStream.status(reqid, STATUS_CODE.FAILURE);
              return;
            }

            try {
              // Read data from the file

              const fileHandle = await fs.open(fileInfo.filename, 'r');
              const { buffer, bytesRead } = await fileHandle.read(
                Buffer.alloc(length),
                0,
                length,
                offset,
              );
              await fileHandle.close();

              // Send the read data back
              sftpStream.data(reqid, buffer.slice(0, bytesRead));
            } catch (err) {
              logServer('Read error:', err);
              sftpStream.status(reqid, STATUS_CODE.FAILURE);
            }
          });

          sftpStream.on('CLOSE', (reqid, handle) => {
            const fileInfo = files.get(handle.toString('utf8'));
            if (fileInfo) {
              // Remove the file handle from the map
              // files.delete(handle.toString('utf8'));
              sftpStream.status(reqid, STATUS_CODE.OK);
            } else {
              sftpStream.status(reqid, STATUS_CODE.FAILURE);
            }
          });
        });
      });
    });

    client.on('end', () => {
      logServer('Client disconnected');
    });
  }

  // disable receiving new connections but wait for existing connections to close
  async close() {
    return new Promise<void>((resolve, reject) => {
      this.server.close((err) => {
        if (err) {
          reject(err);
          return;
        }

        resolve();
      });
    });
  }
}
