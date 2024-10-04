import { platform } from 'node:os';
import Packages from './Packages';

const isWindows = platform() === 'win32';
const packageName = isWindows ? 'ntop' : 'htop';

const itIfSafe = process.env.SAFE === 'true' ? it : xit;

describe('Packages Module', () => {
  let packages: Packages;

  beforeAll(() => {
    packages = new Packages();
  });

  // skip when env variable is not set
  itIfSafe(
    'should be able to install a package',
    async () => {
      await packages.install(packageName);

      const isInstalled = await packages.isInstalled(packageName);

      expect(isInstalled).toBe(true);
    },
    60 * 1000,
  );

  itIfSafe(
    'should be able to uninstall a package',
    async () => {
      await packages.uninstall(packageName);

      const isInstalled = await packages.isInstalled(packageName);

      expect(isInstalled).toBe(false);
    },
    60 * 1000,
  );
});
