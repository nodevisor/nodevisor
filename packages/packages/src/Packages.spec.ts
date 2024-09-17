import Packages from './Packages';
import { Nodevisor } from '@nodevisor/core';

describe('Packages Module', () => {
  let packages: Packages;
  let nodevisor: Nodevisor;

  beforeAll(() => {
    nodevisor = new Nodevisor();
    packages = new Packages(nodevisor);
  });

  it(
    'should be able to install a package',
    async () => {
      await packages.install('httpie');

      const isInstalled = await packages.isInstalled('httpie');

      expect(isInstalled).toBe(true);
    },
    60 * 1000,
  );

  it(
    'should be able to uninstall a package',
    async () => {
      await packages.uninstall('httpie');

      const isInstalled = await packages.isInstalled('httpie');

      expect(isInstalled).toBe(false);
    },
    60 * 1000,
  );
});
