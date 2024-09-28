// same package name for different package managers
import PackageManager from './PackageManager';

type PackageName = Partial<Record<PackageManager, string>>;

const packageNames: Record<string, PackageName> = {
  htop: {
    // [PackageManager.WINGET]: 'ntop',
  },
};

export default packageNames;
