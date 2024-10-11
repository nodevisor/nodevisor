import { platform } from 'node:os';
import SSH from './SSH';

const itIfSafe = process.env.SAFE === 'true' ? it : xit;

describe('Packages Module', () => {
  let ssh: SSH;

  beforeAll(() => {
    ssh = new SSH();
  });

  itIfSafe('should install openssh-server package', async () => {
    const result = await ssh.isInstalled();
    expect(result).toBe(false);

    await ssh.installPackage();

    const result2 = await ssh.isInstalled();
    expect(result2).toBe(true);
  });

  itIfSafe('should start the ssh service', async () => {
    const result = await ssh.isRunning();
    expect(result).toBe(false);

    await ssh.start();

    const result2 = await ssh.isRunning();
    expect(result2).toBe(true);
  });
});
