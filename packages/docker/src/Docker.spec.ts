import Docker from './Docker';

const itIfSafe = process.env.SAFE === 'true' ? it : xit;

describe('AWS Module', () => {
  let docker: Docker;

  beforeAll(() => {
    docker = new Docker();
  });

  itIfSafe('should return false when docker is not installed', async () => {
    const isInstalled = await docker.isInstalled();
    expect(isInstalled).toBe(false);
  });

  itIfSafe(
    'should be able to install docker',
    async () => {
      await docker.install();

      const isInstalled = await docker.isInstalled();

      expect(isInstalled).toBe(true);
    },
    60 * 1000,
  );

  itIfSafe('should return the correct docker version', async () => {
    const version = await docker.getVersion();
    expect(version).toMatch(/Docker version/);
  });
});
