import $, { type User } from '@nodevisor/core';
import { ClusterNode, type ClusterNodeConfig } from '@nodevisor/cluster';

export type DockerNodeConfig = ClusterNodeConfig & {};

export default class DockerNode extends ClusterNode {
  constructor(config: DockerNodeConfig) {
    const { ...rest } = config;

    super(rest);
  }

  async setup(setupUser: User, runnerUser: User, isPrimary = false) {
    const $con = await super.setup(setupUser, runnerUser, isPrimary);

    const $runner = await $(runnerUser.clone({ host: this.host }));

    // install docker

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

    return $con;
  }
}
