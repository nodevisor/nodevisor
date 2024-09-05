import type Connection from '../Connection';

// reboot
export async function reboot(connection: Connection) {
  const { $ } = connection;
  return $`reboot`;
}

// shutdown
export async function shutdown(connection: Connection) {
  const { $ } = connection;
  return $`shutdown now`;
}

// uptime
export async function uptime(connection: Connection) {
  const { $ } = connection;
  return $`uptime`;
}
