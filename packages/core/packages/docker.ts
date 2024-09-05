import debug from 'debug';

import Connection from '../Connection';

import * as fs from './fs';
import * as group from './group';
import * as packages from './packages';

const log = debug('packages:docker');

export async function isRunning(connection: Connection) {
  const { $ } = connection;

  const statusResponse = await $`systemctl --no-pager status docker`;

  return !!statusResponse?.includes('active (running)');
}

export async function start(connection: Connection) {
  const { $ } = connection;

  if (await isRunning(connection)) {
    log('Docker already running');
    return;
  }

  await $`systemctl start docker`;

  if (!(await isRunning(connection))) {
    throw new Error('Failed to start docker');
  }
}

export async function isInstalled(connection: Connection) {
  const { $ } = connection;

  const response = await $`docker --version`;

  return !!response;
}

export async function install(connection: Connection) {
  const { $ } = connection;

  if (await isInstalled(connection)) {
    log('Docker already installed');
    return;
  }

  // install docker
  await packages.install(connection, [
    'apt-transport-https',
    'ca-certificates',
    'software-properties-common',
    'gnupg2',
    'curl',
  ]);

  await fs.mkdir(connection, `/etc/apt/keyrings`);

  await $`curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc`;

  await $`chmod a+r /etc/apt/keyrings/docker.asc`;

  await $`echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null`;

  // update the package database with the Docker packages from the newly added repo
  await packages.update(connection);

  // install docker
  await packages.install(connection, ['docker-ce', 'docker-ce-cli', 'containerd.io']);

  await start(connection);
}

export async function isSwarmActive(connection: Connection) {
  const { $ } = connection;

  const response = await $`docker info`;
  return response?.includes('Swarm: active');
}

export async function swarmInit(connection: Connection) {
  const { $ } = connection;

  if (await isSwarmActive(connection)) {
    log('Docker swarm already active');
    return;
  }

  await $`docker swarm init`;

  if (!(await isSwarmActive(connection))) {
    throw new Error('Failed to initialize docker swarm');
  }
}

// allow username to run docker commands without sudo
export async function allowUser(connection: Connection, username: string) {
  const isUserInGroup = await group.isUserInGroup(connection, username, 'docker');
  if (isUserInGroup) {
    log(`User ${username} is already in docker group`);
    return;
  }

  await group.addUser(connection, username, 'docker');
}
