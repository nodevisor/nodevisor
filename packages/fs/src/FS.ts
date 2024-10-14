import { Module, Platform, raw } from '@nodevisor/core';
import PWSH from '@nodevisor/pwsh';
import Users from '@nodevisor/users';

export type FSOptions<Flag = 'r'> = {
  encoding?: BufferEncoding | null;
  mode?: number;
  flag?: Flag;
};

export default class FS extends Module {
  readonly name = 'fs';

  readonly pwsh = new PWSH(this.nodevisor);
  readonly users = new Users(this.nodevisor);

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

    // use correct file owner and group if "as" is defined
    if (this.nodevisor.hasAs) {
      const user = await this.users.whoami();
      if (user) {
        const withoutAs = this.nodevisor.clone({
          as: undefined,
        });

        const fs = new FS(withoutAs);
        await fs.chown(path, `${user}:${user}`);
      }
    }
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

    if (await this.exists(path)) {
      return;
    }

    await this.$`mkdir ${recursive ? raw('-p') : ''} ${path}`;
  }

  async rmdir(path: string, options: { recursive?: boolean } = {}): Promise<void> {
    const { recursive = false } = options;

    await this.$`rm ${recursive ? raw('-rf') : raw('-r')} ${path}`;
  }

  async exists(path: string) {
    switch (await this.platform()) {
      case Platform.WINDOWS:
        // pwsh returns exit code 0 for true and false as well
        return this.pwsh.command`Test-Path ${path}`.boolean();
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
    switch (await this.platform()) {
      case Platform.WINDOWS:
        // pwsh returns exit code 0 for true and false as well
        return this.pwsh.command`[System.IO.Path]::GetTempFileName()`.text();
      default:
        return this.$`mktemp`.text();
    }
  }

  async tempDir() {
    switch (await this.platform()) {
      case Platform.WINDOWS:
        // pwsh returns exit code 0 for true and false as well
        return this.pwsh
          .command`$tempDir = New-Item -ItemType Directory -Path ([System.IO.Path]::GetTempPath() + [System.IO.Path]::GetRandomFileName()); $tempDir.FullName`.text();
      default:
        return this.$`mktemp -d`.text();
    }
  }

  // get absolute path
  // todo move to path.resolve
  async abs(path: string) {
    return this.$`readlink -f ${path}`.text();
  }
}
