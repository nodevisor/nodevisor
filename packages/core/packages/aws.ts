import Connection from '../Connection';

// import * as env from './env';
import * as fs from './fs';
import * as packages from './packages';
// import * as sftp from './sftp';

export async function isInstalled(connection: Connection) {
  const { $ } = connection;

  const response = await $`aws --version`;

  return response.includes('aws-cli');
}

export async function install(connection: Connection) {
  const { $ } = connection;

  if (await isInstalled(connection)) {
    return;
  }

  await packages.install(connection, ['unzip', 'curl']);

  const tempFile = await fs.temp(connection);

  await $`curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o ${tempFile} --silent`;

  const tempDir = await fs.tempDir(connection);

  await $`unzip ${tempFile} -d ${tempDir}`;
  await $`${tempDir}/aws/install`;

  await fs.rm(connection, tempFile);
  await fs.rmdir(connection, tempDir);
}

export async function set(connection: Connection, key: string, value: string, profile?: string) {
  const { $ } = connection;

  if (!profile) {
    return $`aws configure set ${key} ${value}`;
  }

  return $`aws configure set ${key} ${value} --profile ${profile}`;
}

export async function get(connection: Connection, key: string, profile?: string) {
  const { $ } = connection;

  if (!profile) {
    return $`aws configure get ${key}`;
  }

  return $`aws configure get ${key} --profile ${profile}`;
}

export async function setDefaultRegion(connection: Connection, region: string) {
  return set(connection, 'default.region', region);
}

export async function setCredentials(
  connection: Connection,
  accessKeyId: string,
  secretAccessKey: string,
) {
  await set(connection, 'aws_access_key_id', accessKeyId);
  await set(connection, 'aws_secret_access_key', secretAccessKey);
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
