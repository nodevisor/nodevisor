import { Package } from '@nodevisor/core';
import packages from '@nodevisor/packages';
import fs from '@nodevisor/fs';

export default class AWS extends Package {
  readonly name = 'aws';
  readonly packages = this.module(packages);
  readonly fs = this.module(fs);

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
    await this.packages.install(['unzip', 'curl']);

    const tempFile = await this.fs.temp();

    await this
      .$`curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o ${tempFile} --silent`;

    const tempDir = await this.fs.tempDir();

    await this.$`unzip ${tempFile} -d ${tempDir}`;
    await this.$`${tempDir}/aws/install`;

    await this.fs.rm(tempFile);
    await this.fs.rmdir(tempDir, { recursive: true });
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
