import { Package, type Nodevisor } from '@nodevisor/core';
import { Packages } from '@nodevisor/packages';
import { FS } from '@nodevisor/fs';

export default class AWS extends Package {
  constructor(nodevisor: Nodevisor) {
    super(nodevisor, {
      name: 'aws',
    });
  }

  async getVersion() {
    return this.$`aws --version`;
  }

  async isInstalled() {
    const response = await this.$`aws --version`;

    return response.includes('aws-cli');
  }

  async update() {
    if (!(await this.isInstalled())) {
      return this;
    }

    await this.$`aws --update`;

    return this;
  }

  async installPackage() {
    const packages = this.getModule(Packages);
    const fs = this.getModule(FS);

    await packages.install(['unzip', 'curl']);

    const tempFile = await fs.temp();

    await this
      .$`curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o ${tempFile} --silent`;

    const tempDir = await fs.tempDir();

    await this.$`unzip ${tempFile} -d ${tempDir}`;
    await this.$`${tempDir}/aws/install`;

    await fs.rm(tempFile);
    await fs.rmdir(tempDir, { recursive: true });
  }

  async uninstallPackage() {
    throw new Error('Not implemented');
  }

  async set(key: string, value: string, profile?: string) {
    if (!profile) {
      return this.$`aws configure set ${key} ${value}`;
    }

    return this.$`aws configure set ${key} ${value} --profile ${profile}`;
  }

  async get(key: string, profile?: string) {
    if (!profile) {
      return this.$`aws configure get ${key}`;
    }

    return this.$`aws configure get ${key} --profile ${profile}`;
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
