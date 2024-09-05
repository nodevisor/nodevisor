import type Connection from '../Connection';

import * as fs from './fs';
import * as sftp from './sftp';
import * as sshpass from './sshpass';

export async function restart(connection: Connection) {
  const { $ } = connection;

  return $`systemctl restart ssh`;
}

export async function disablePasswordAuthentication(connection: Connection) {
  const { $ } = connection;

  await $`sed -i 's/^#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config`;
  await $`sed -i 's/^PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config`;

  await restart(connection);
}

export async function enablePasswordAuthentication(connection: Connection) {
  const { $ } = connection;

  await $`sed -i 's/^#PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config`;
  await $`sed -i 's/^PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config`;

  await restart(connection);
}

// login as different user to local machine via ssh,
export async function connect(
  connection: Connection,
  username: string,
  config: { host?: string } & (
    | { privateKeyPath: string; passphrase?: string }
    | { password: string }
  ),
) {
  const { $ } = connection;
  const { host = 'localhost' } = config;

  if ('password' in config) {
    const { password } = config;

    await sshpass.install(connection);

    // copy password to remote machine
    const remotePath = await sftp.putTempContent(connection, password);

    try {
      const shellStream = await connection.requestShell();

      shellStream.on('data', (data) => {
        console.log('!!!!! data', data.toString());
        /*
        let stringData = data.toString().trim();
        if (stringData === "[sudo] password for root:") {
          let pass = "[Password]\n";
          shellStream.write(pass);
        }
        */
      });

      shellStream.stderr.on('data', (data) => {
        console.log('!!!!! error', data.toString());
        // console.log(data);
      });
      // shellStream.write("sudo -i\n");

      // -t allocation of a pseudo-terminal for interactive shell
      await $`sshpass -f ${remotePath} ssh -t ${username}@${host}`;
    } finally {
      // remove the password file from the remote machine after using it
      await fs.rm(connection, remotePath);
    }
  } else {
    const { privateKeyPath, passphrase } = config;
    if (passphrase) {
      throw new Error('Passphrase is not supported yet');
    }

    await $`ssh -i ${privateKeyPath} ${username}@${host}`;
  }
}
