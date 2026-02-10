import fs from 'fs/promises';
import { Module } from '@nodevisor/shell';
import Env from '@nodevisor/env';
import FS from '@nodevisor/fs';
import path from 'path/posix';

export default class AuthorizedKeys extends Module<{
  sshDir: string;
  authorizedKeysFile: string;
}> {
  readonly name = 'authorizedKeys';

  readonly fs = new FS(this.nodevisor);
  readonly env = new Env(this.nodevisor);

  get sshDir() {
    return this.config.sshDir || '.ssh';
  }

  get authorizedKeysFile() {
    return this.config.authorizedKeysFile || 'authorized_keys';
  }

  async getAuthorizedKeysPath() {
    const homeDir = await this.env.home();
    return path.join(homeDir, this.sshDir, this.authorizedKeysFile);
  }

  async ensureSSHDirectory(): Promise<void> {
    const homeDir = await this.env.home();
    const sshPath = path.join(homeDir, this.sshDir);
    await this.fs.mkdir(sshPath, { recursive: true });

    // set permission 0x700
    await this.fs.chmod(sshPath, '700');
  }

  async append(publicKey: string) {
    const trimmedKey = publicKey.trim();
    if (!trimmedKey) {
      throw new Error('Public key is required and cannot be empty.');
    }

    await this.ensureSSHDirectory();
    const authorizedKeysPath = await this.getAuthorizedKeysPath();
    const currentContent = await this.fs.readFile(authorizedKeysPath);
    const contentToAppend = currentContent ? `\n${trimmedKey}` : trimmedKey;

    await this.fs.appendFile(authorizedKeysPath, contentToAppend);

    await this.fs.chmod(authorizedKeysPath, '600');
  }

  async write(publicKey: string) {
    const trimmedKey = publicKey.trim();
    if (!trimmedKey) {
      throw new Error('Public key is required and cannot be empty.');
    }

    await this.ensureSSHDirectory();

    const authorizedKeysPath = await this.getAuthorizedKeysPath();
    await this.fs.writeFile(authorizedKeysPath, trimmedKey);

    await this.fs.chmod(authorizedKeysPath, '600');
  }

  async readPublicKey(publicKeyPath: string, remotePath = false) {
    try {
      return remotePath ? await this.fs.readFile(publicKeyPath) : await fs.readFile(publicKeyPath);
    } catch (error) {
      throw new Error(
        `Failed to read public key file at ${publicKeyPath}: ${(error as Error).message}`,
      );
    }
  }

  async appendFromFile(publicKeyPath: string, remotePath = false) {
    if (!publicKeyPath) {
      throw new Error('Public key file path is required');
    }

    const publicKey = await this.readPublicKey(publicKeyPath, remotePath);

    await this.append(publicKey.toString());
  }

  async writeFromFile(publicKeyPath: string, remotePath = false) {
    if (!publicKeyPath) {
      throw new Error('Public key file path is required');
    }

    const publicKey = await this.readPublicKey(publicKeyPath, remotePath);

    await this.write(publicKey.toString());
  }
}
