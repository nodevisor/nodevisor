import Packages from './Packages';

describe('Packages Module', () => {
  let packages: Packages;

  beforeAll(() => {
    packages = new Packages();
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
