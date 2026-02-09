import { existsSync, unlinkSync, readFileSync, statSync } from 'node:fs';
import generateKey from './generateKey';

describe('generateKey', () => {
  const testKeyPath = './test_key';
  const testPassphrase = 'test-passphrase';

  beforeEach(() => {
    if (existsSync(testKeyPath)) {
      unlinkSync(testKeyPath);
    }
    if (existsSync(testKeyPath + '.pub')) {
      unlinkSync(testKeyPath + '.pub');
    }
  });

  afterEach(() => {
    // Clean up test files after each test
    if (existsSync(testKeyPath)) {
      unlinkSync(testKeyPath);
    }
    if (existsSync(testKeyPath + '.pub')) {
      unlinkSync(testKeyPath + '.pub');
    }
  });

  it('should generate private and public key files', async () => {
    await generateKey(testKeyPath, testPassphrase);

    expect(existsSync(testKeyPath)).toBe(true);
    expect(existsSync(testKeyPath + '.pub')).toBe(true);
  });

  it('should generate valid OpenSSH format keys', async () => {
    await generateKey(testKeyPath, testPassphrase);

    const privateKey = readFileSync(testKeyPath, 'utf-8').trim();
    const publicKey = readFileSync(testKeyPath + '.pub', 'utf-8').trim();

    // Check private key format
    expect(privateKey).toMatch(/^-----BEGIN OPENSSH PRIVATE KEY-----/);
    expect(privateKey).toMatch(/-----END OPENSSH PRIVATE KEY-----$/);

    // Check public key format
    expect(publicKey).toMatch(/^ssh-ed25519 /);
  });

  it('should set correct file permissions', async () => {
    await generateKey(testKeyPath, testPassphrase);

    const privateKeyStats = statSync(testKeyPath);
    const publicKeyStats = statSync(testKeyPath + '.pub');

    // Check private key permissions (0o600 = rw-------)
    expect(privateKeyStats.mode & 0o777).toBe(0o600);

    // Check public key permissions (0o644 = rw-r--r--)
    expect(publicKeyStats.mode & 0o777).toBe(0o644);
  });

  it('should work with empty passphrase', async () => {
    await generateKey(testKeyPath);

    expect(existsSync(testKeyPath)).toBe(true);
    expect(existsSync(testKeyPath + '.pub')).toBe(true);

    const privateKey = readFileSync(testKeyPath, 'utf-8');
    expect(privateKey).toMatch(/^-----BEGIN OPENSSH PRIVATE KEY-----/);
  });
});
