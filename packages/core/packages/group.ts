import type Connection from '../Connection';

export async function addUser(connection: Connection, username: string, group: string) {
  const { $ } = connection;
  return $`usermod -aG ${group} ${username}`;
}

export async function removeUser(connection: Connection, username: string, group: string) {
  const { $ } = connection;
  return $`gpasswd -d ${username} ${group}`;
}

export async function userGroups(connection: Connection, username: string) {
  const { $ } = connection;
  const items = await $`id -Gn ${username}`;

  return items.split(' ').map((item: string) => item.trim());
}

export async function isUserInGroup(connection: Connection, username: string, group: string) {
  const list = await userGroups(connection, username);

  return list.includes(group);
}
