import AuthorizedKeys from '@nodevisor/authorized-keys';
import { endpoints } from '@nodevisor/endpoint';
import Packages from '@nodevisor/packages';
import SSH from '@nodevisor/ssh';
import UFW from '@nodevisor/ufw';
import Users from '@nodevisor/users';
import Auth from '@nodevisor/auth';
import Docker, { DockerSwarm } from '@nodevisor/docker';
import ClusterUser from './ClusterUser';

export type ClusterNodeConfig = {
  host: string; // ip or hostname
  tags?: string[];
};

export default class ClusterNode {
  private config: ClusterNodeConfig;

  constructor(config: ClusterNodeConfig) {
    this.config = config;
  }

  get host() {
    return this.config.host;
  }

  async setup(setupUser: ClusterUser, runnerUser: ClusterUser, isPrimary = false) {
    if (!setupUser) {
      throw new Error('Setup user is required for cluster node setup');
    }

    const $con = await setupUser.connect(this.host);

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

    if (!runnerUser) {
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

    // connect to the runner user
    const $runner = await runnerUser.connect(this.host);

    /*

    // install docker
    await $con(DockerSwarm).install();

    // allow app user to run docker commands without sudo
    await $con(Docker).allowUser(app.username);

    // start swarm
    await $con(DockerSwarm).start();

    // install AWS Cli
    await $con(AWS).install();
    await $con(AWS).setCredentials(aws.accessKeyId, aws.secretAccessKey);
    await $con(AWS).setDefaultRegion(aws.defaultRegion);
    */
  }
}
