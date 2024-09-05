import debug from 'debug';

import type Connection from '../Connection';

import * as env from './env';
import * as fs from './fs';

const log = debug('packages:sshKeygen');

export async function generate(
  connection: Connection,
  options: {
    comment?: string;
    passphrase?: string;
    keyfile?: string;
    bits?: number;
    curve?: string;
  } = {},
) {
  const { curve = 'rsa', bits = 4096, comment = '', passphrase = '', keyfile } = options;
  const { $ } = connection;

  const home = await env.home(connection);
  const keyfilePath = keyfile !== undefined ? keyfile : `${home}/.ssh/id_rsa`;

  if (await fs.exists(connection, keyfilePath)) {
    log(`Private key already exists at ${keyfilePath}`);
    return;
  }

  await $`ssh-keygen -t ${curve} -b ${bits} -C "${comment}" -N "${passphrase}" -f ${keyfilePath}`;
}
