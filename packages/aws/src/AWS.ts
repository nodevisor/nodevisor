import { Package, raw } from '@nodevisor/core';
import Packages, { PackageManager } from '@nodevisor/packages';
import FS from '@nodevisor/fs';
import OS from '@nodevisor/os';

function getLink(arch: string) {
  if (arch.includes('arch')) {
    return 'https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip';
  }

  return 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip';
}

export default class AWS extends Package<{
  command?: string;
}> {
  readonly name = 'aws';

  readonly packages = new Packages(this.nodevisor);
  readonly fs = new FS(this.nodevisor);
  readonly os = new OS(this.nodevisor);
  get command() {
    return this.config.command || 'aws';
  }

  private $aws(strings: TemplateStringsArray, ...values: string[]) {
    return this.$`${raw(this.command)} `.append(strings, ...values);
  }

  async getVersion() {
    if (!(await this.isInstalled())) {
      throw new Error('AWS CLI is not installed');
    }

    return this.$aws`--version`.text();
  }

  async isInstalled() {
    try {
      const response = await this.$aws`--version`.text();

      return response.includes('aws-cli');
    } catch (error) {
      return false;
    }
  }

  async update() {
    if (!(await this.isInstalled())) {
      return this;
    }

    await this.$aws`--update`;

    return this;
  }

  async installPackage() {
    switch (await this.packages.packageManager()) {
      case PackageManager.BREW:
        await this.packages.install('awscli');
        return;
      case PackageManager.WINGET:
        await this.packages.install('Amazon.AWSCLI');
        return;
      default:
        await this.packages.install(['unzip', 'curl']);

        const tempFile = await this.fs.temp();

        const arch = await this.os.arch();

        const link = getLink(arch);

        await this.$`curl ${link} -o ${tempFile} --silent`;

        const tempDir = await this.fs.tempDir();

        await this.$`unzip ${tempFile} -d ${tempDir}`;
        await this.$`${tempDir}/aws/install`;

        await this.fs.rm(tempFile);
        await this.fs.rmdir(tempDir, { recursive: true });
        break;
    }
  }

  async uninstallPackage() {
    throw new Error('Not implemented');
  }

  async set(key: string, value: string, profile?: string) {
    if (!profile) {
      return this.$aws`configure set ${key} ${value}`.text();
    }

    return this.$aws`configure set ${key} ${value} --profile ${profile}`.text();
  }

  async get(key: string, profile?: string) {
    if (!profile) {
      return this.$aws`configure get ${key}`.text();
    }

    return this.$aws`configure get ${key} --profile ${profile}`.text();
  }

  async setDefaultRegion(region: string) {
    return this.set('default.region', region);
  }

  async setCredentials(accessKeyId: string, secretAccessKey: string) {
    await this.set('aws_access_key_id', accessKeyId);
    await this.set('aws_secret_access_key', secretAccessKey);
  }
}
/*
export async function setCredentials(
  connection: Connection,
  accessKeyId: string,
  secretAccessKey: string,
) {
  const home = await env.home(connection);

  await fs.mkdir(connection, `${home}/.aws`);

  const content = `[default]
aws_access_key_id = ${accessKeyId}
aws_secret_access_key = ${secretAccessKey}
`;

  await sftp.putContent(connection, content, `${home}/.aws/credentials`);
}
*/
