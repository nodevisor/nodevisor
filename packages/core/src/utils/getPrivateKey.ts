import fs from 'node:fs/promises';
import { type SSHConnectionConfig } from '../connections/SSHConnection';
import untildify from 'untildify';

export default async function getPrivateKey(config: SSHConnectionConfig) {
  if ('privateKeyPath' in config && config.privateKeyPath) {
    const { privateKeyPath, ...rest } = config;

    const privateKey = await fs.readFile(untildify(privateKeyPath), 'utf8');

    return privateKey;
  }

  if ('privateKey' in config && config.privateKey) {
    return config.privateKey;
  }

  throw new Error('Private key is required');
}
