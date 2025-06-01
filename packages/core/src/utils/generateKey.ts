import { generateKeyPairSync } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import sshpk from 'sshpk';

export default async function generateKey(keyPath: string, passphrase?: string) {
  if (passphrase?.trim() === '') {
    throw new Error('Passphrase cannot be empty string');
  }

  if (existsSync(keyPath)) {
    throw new Error(`Key already exists at ${keyPath}`);
  }

  const { privateKey: pkcs8Priv, publicKey: spkiPub } = generateKeyPairSync('ed25519', {
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  });

  const privKey = sshpk.parsePrivateKey(pkcs8Priv, 'pem').toString('openssh', { passphrase });
  const pubKey = sshpk.parseKey(spkiPub, 'pem').toString('ssh');

  writeFileSync(keyPath, privKey, { mode: 0o600 });
  writeFileSync(keyPath + '.pub', pubKey + '\n', { mode: 0o644 });
}
