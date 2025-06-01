import { User, type UserConfig } from '@nodevisor/core';

export type ClusterUserConfig = UserConfig;

const DEFAULT_PRIVATE_KEY_PATH = '~/.ssh/nodevisor_id_ed25519';
const DEFAULT_PUBLIC_KEY_PATH = '~/.ssh/nodevisor_id_ed25519.pub';

export default class ClusterUser extends User {
  constructor(config: ClusterUserConfig) {
    const clusterUserConfig = {
      ...config,
    };

    const hasPrivateKey = 'privateKey' in config || 'privateKeyPath' in config;
    if (hasPrivateKey) {
      super(clusterUserConfig);
      return;
    }

    super({
      ...config,
      privateKeyPath: DEFAULT_PRIVATE_KEY_PATH,
      publicKeyPath: DEFAULT_PUBLIC_KEY_PATH,
    });
  }
}
