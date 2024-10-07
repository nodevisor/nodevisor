import { Module } from '@nodevisor/core';
import Env from '@nodevisor/env';
import FS from '@nodevisor/fs';

export default class AuthorizedKeys extends Module {
  readonly name = 'authorizedKeys';
  readonly fs = new FS(this.nodevisor);
  readonly env = new Env(this.nodevisor);

  async append(publicKey: string) {
    if (!publicKey) {
      throw new Error('Public key is required');
    }

    // Append the public key to the authorized_keys file on the server
    const home = await this.env.home();

    let content = publicKey.trim();

    // add new line if file is not empty
    const currentContent = await this.fs.readFile(`${home}/.ssh/authorized_keys`);
    if (currentContent.length > 0) {
      content = `\n${content}`;
    }

    await this.fs.appendFile(`${home}/.ssh/authorized_keys`, content);
  }

  async write(publicKey: string) {
    const home = await this.env.home();

    // create .ssh directory if it doesn't exist
    await this.fs.mkdir(`${home}/.ssh`, { recursive: true });

    // Append the public key to the authorized_keys file on the server
    await this.fs.writeFile(`${home}/.ssh/authorized_keys`, publicKey.trim());
  }
}
