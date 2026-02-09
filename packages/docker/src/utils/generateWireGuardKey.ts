import fs from 'node:fs';
import path from 'node:path';
import { expandHomeDir } from '@nodevisor/shell';
import { x25519 } from '@noble/curves/ed25519';

export default function generateWireGuardKey(outPath: string, overwrite = false) {
  const privPath = expandHomeDir(outPath);
  const pubPath = privPath + '.pub';

  if (!overwrite && fs.existsSync(privPath)) {
    throw new Error(`Refusing to overwrite existing file: ${privPath}`);
  }
  if (!overwrite && fs.existsSync(pubPath)) {
    throw new Error(`Refusing to overwrite existing file: ${pubPath}`);
  }

  const privBytes = x25519.utils.randomPrivateKey();
  const pubBytes = x25519.getPublicKey(privBytes);

  // 5) Base64-encode both raw buffers. WireGuard expects exactly 32 raw bytes → 44-char Base64 (+ “=”).
  const privB64 = Buffer.from(privBytes).toString('base64');
  const pubB64 = Buffer.from(pubBytes).toString('base64');

  //    - Private key → 0o600
  //    - Public key  → 0o644
  fs.mkdirSync(path.dirname(privPath), { recursive: true });
  fs.writeFileSync(privPath, privB64 + '\n', { mode: 0o600 });
  fs.writeFileSync(pubPath, pubB64 + '\n', { mode: 0o644 });
}
