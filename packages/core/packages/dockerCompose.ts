async function install(ssh: NodeSSH) {
  // install docker-compose
  await exec(
    ssh,
    'curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose',
  );
  await exec(ssh, 'chmod +x /usr/local/bin/docker-compose');
  const response = await exec(ssh, 'docker-compose --version');
  if (!response?.startsWith('Docker Compose version')) {
    throw new Error('Failed to install docker-compose');
  }
}
