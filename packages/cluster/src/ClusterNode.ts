import AuthorizedKeys from '@nodevisor/authorized-keys';
import { endpoints } from '@nodevisor/endpoint';
import type Registry from '@nodevisor/registry';
import Packages from '@nodevisor/packages';
import SSH from '@nodevisor/ssh';
import UFW from '@nodevisor/ufw';
import Users from '@nodevisor/users';
import Auth from '@nodevisor/auth';
import $, { User } from '@nodevisor/core';

export type ClusterNodeConfig = {
  host: string;
};

export default abstract class ClusterNode {
  readonly host: string; // ip or hostname

  constructor(config: ClusterNodeConfig) {
    const { host } = config;

    this.host = host;
  }

  $(user: User) {
    const userWithHost = user.clone({ host: this.host });
    return $(userWithHost);
  }

  abstract deploy(name: string, runner: User, manager: ClusterNode, options?: {}): Promise<void>;

  // prepare node for deployment and secure it
  async setup(admin: User, runner: User, _manager: ClusterNode, _options?: {}) {
    if (!admin) {
      throw new Error('Admin user is required for cluster node setup');
    }

    if (!runner || !runner.username) {
      throw new Error('Runner user is required for cluster node setup');
    }

    const $con = this.$(admin);

    // get list of new packages
    await $con(Packages).update();

    // allow setup user to use key for authentication instead of password
    const publicKey = await admin.getPublicKey();
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

    // create runner user
    await $con(Users).add(runner.username);

    if (runner.password && !publicKey) {
      // set password for the runner user if it is provided
      await $con(Auth).setPassword(runner.username, runner.password as string);
    }

    // assign public key to the runner user
    const runnerPublicKey = await runner.getPublicKey();
    if (runnerPublicKey) {
      const $runner = $con.as(runner.username);
      await $runner(AuthorizedKeys).write(runnerPublicKey);
    }
  }

  async authenticateRegistries(user: User, registries: Registry[], _manager: ClusterNode) {
    const $con = this.$(user);

    await Promise.all(registries.map((registry) => registry.login($con)));
  }
}
