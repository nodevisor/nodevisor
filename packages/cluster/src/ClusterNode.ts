import AuthorizedKeys from '@nodevisor/authorized-keys';
import { endpoints } from '@nodevisor/endpoint';
import Packages from '@nodevisor/packages';
import SSH from '@nodevisor/ssh';
import UFW from '@nodevisor/ufw';
import Users from '@nodevisor/users';
import Auth from '@nodevisor/auth';
import $, { User } from '@nodevisor/core';

export type ClusterNodeConfig = {
  host: string;
};

export default class ClusterNode {
  readonly host: string; // ip or hostname

  constructor(config: ClusterNodeConfig) {
    const { host } = config;

    this.host = host;
  }

  async setup(setupUser: User, runnerUser: User, isPrimary = false) {
    if (!setupUser) {
      throw new Error('Setup user is required for cluster node setup');
    }

    const $con = await $(setupUser.clone({ host: this.host }));

    // get list of new packages
    await $con(Packages).update();

    // allow setup user to use key for authentication instead of password
    const publicKey = await setupUser.getPublicKey();
    if (publicKey) {
      // assign public key to the root user
      await $con(AuthorizedKeys).write(publicKey);

      // disable password authentication
      await $con(SSH).disablePasswordAuthentication();
    }

    // install firewall and allow only ssh
    await $con(UFW).install();
    await $con(UFW).allow([endpoints.ssh]);
    await $con(UFW).start();

    if (!runnerUser || !runnerUser.username) {
      throw new Error('Runner user is required for cluster node setup');
    }

    // create runner user
    await $con(Users).add(runnerUser.username);

    if (runnerUser.password && !publicKey) {
      // set password for the runner user if it is provided
      await $con(Auth).setPassword(runnerUser.username, runnerUser.password as string);
    }

    // assign public key to the runner user
    const runnerPublicKey = await runnerUser.getPublicKey();
    if (runnerPublicKey) {
      const $runner = $con.as(runnerUser.username);
      await $runner(AuthorizedKeys).write(runnerPublicKey);
    }

    return $con;
  }
}
