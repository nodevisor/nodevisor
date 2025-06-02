import { generateKeyPairSync } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import untildify from 'untildify';
import sshpk from 'sshpk';

export default async function generateKey(keyPath: string, passphrase?: string, overwrite = false) {
  if (passphrase?.trim() === '') {
    throw new Error('Passphrase cannot be empty string');
  }

  const expandedPath = path.resolve(untildify(keyPath));

  if (!overwrite && existsSync(expandedPath)) {
    throw new Error(`Key already exists at ${expandedPath}`);
  }

  const { privateKey: pkcs8Priv, publicKey: spkiPub } = generateKeyPairSync('ed25519', {
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  });

  const privKey = sshpk.parsePrivateKey(pkcs8Priv, 'pem').toString('openssh', { passphrase });
  const pubKey = sshpk.parseKey(spkiPub, 'pem').toString('ssh');

  writeFileSync(expandedPath, privKey, { mode: 0o600 });
  writeFileSync(expandedPath + '.pub', pubKey + '\n', { mode: 0o644 });
}
