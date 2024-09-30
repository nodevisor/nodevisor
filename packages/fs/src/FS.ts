import { Module, Platform } from '@nodevisor/core';

export type FSOptions<Flag = 'r'> = {
  encoding?: BufferEncoding | null;
  mode?: number;
  flag?: Flag;
};

export default class FS extends Module {
  readonly name = 'fs';

  async readFile(path: string, options: FSOptions<'r'> = {}): Promise<string | Buffer> {
    const { encoding = 'utf8', flag = 'r' } = options;

    const content = await this.connection.getContent(path, { encoding, flags: flag });
    return encoding === null ? content : content.toString(encoding);
  }

  async writeFile(
    path: string,
    data: string | Buffer,
    options: FSOptions<'w' | 'a'> = {},
  ): Promise<void> {
    const { encoding = 'utf8', mode = 0o666, flag = 'w' } = options;
    const content = Buffer.isBuffer(data) ? data : Buffer.from(data, encoding || 'utf8');

    await this.connection.putContent(content, path, { encoding, mode, flags: flag });
  }

  async appendFile(
    path: string,
    data: string | Buffer,
    options: FSOptions<'a'> = {},
  ): Promise<void> {
    return this.writeFile(path, data, { ...options, flag: 'a' });
  }

  async unlink(path: string): Promise<void> {
    if (await this.exists(path)) {
      await this.$`rm ${path}`;
    }
  }

  async rm(path: string) {
    if (await this.exists(path)) {
      await this.$`rm ${path}`;
    }
  }

  async mkdir(path: string, options: { recursive?: boolean } = {}): Promise<void> {
    const { recursive = false } = options;

    await this.$`mkdir ${recursive ? '-p' : ''} ${path}`;
  }

  async rmdir(path: string, options: { recursive?: boolean } = {}): Promise<void> {
    const { recursive = false } = options;

    await this.$`rm -r${recursive ? '-f' : ''} ${path}`;
  }

  async exists(path: string) {
    switch (await this.platform()) {
      case Platform.WINDOWS:
        return this.$`powershell Test-Path ${path}`.boolean(true);
      default:
        return this.$`test -e ${path}`.boolean(true);
    }
  }

  // not fully compatible yet
  async chmod(path: string, mode: string) {
    return this.$`chmod ${mode} ${path}`;
  }

  async chown(path: string, owner: string) {
    return this.$`chown ${owner} ${path}`;
  }

  async chgrp(path: string, group: string) {
    return this.$`chgrp ${group} ${path}`;
  }

  /*
  async readdir(path: string): Promise<string[]> {
  }
  */

  async mv(source: string, destination: string) {
    return this.$`mv ${source} ${destination}`;
  }

  async stat(path: string) {
    return this.$`stat ${path}`.text();
  }

  async temp() {
    return this.$`mktemp`.text();
  }

  async tempDir() {
    return this.$`mktemp -d`.text();
  }

  // get absolute path
  // todo move to path.resolve
  async abs(path: string) {
    return this.$`readlink -f ${path}`.text();
  }
}
