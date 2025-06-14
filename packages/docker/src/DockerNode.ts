import FS from '@nodevisor/fs';
import UFW from '@nodevisor/ufw';
import $ from '@nodevisor/core';
import { spawn } from 'node:child_process';
import { NodevisorProxy, log as baseLog } from '@nodevisor/core';
import { Protocol } from '@nodevisor/endpoint';
import { ClusterNode, type ClusterNodeConfig, ClusterUser } from '@nodevisor/cluster';
import DockerCompose from './DockerCompose';
import Docker from './Docker';
import DockerSwarm from './DockerSwarm';
import type Registry from '@nodevisor/registry';
import DockerStack from './DockerStack';
import fs from 'node:fs/promises';
import DockerService from './DockerService';

const log = baseLog.extend('DockerNode');
const logDeploy = log.extend('deploy');

export type DockerNodeConfig = ClusterNodeConfig & {};

export default class DockerNode extends ClusterNode {
  constructor(config: DockerNodeConfig) {
    const { ...rest } = config;

    super(rest);
  }

  isEqual(node: DockerNode) {
    return this.host === node.host;
  }

  static async deployToConnection(
    $con: NodevisorProxy,
    name: string,
    yaml: string,
    type: 'swarm' | 'compose',
  ) {
    const tempFile = await $con(FS).temp();
    logDeploy('temp file', tempFile);

    try {
      await $con(FS).writeFile(tempFile, yaml);
      logDeploy('docker compose file saved', tempFile);

      if (type === 'compose') {
        const dockerCompose = await $con(DockerCompose);
        const result = await dockerCompose.up({
          file: tempFile,
          detach: true, // run in background
          wait: true, // wait for services to be ready
        });

        logDeploy('deploy result', result);
      } else if (type === 'swarm') {
        const dockerStack = await $con(DockerStack);
        const result = await dockerStack.deploy(name, {
          composeFile: tempFile,
          prune: true,
          // without it w are not able to get image from private repo
          withRegistryAuth: true,
        });

        logDeploy('deploy result', result);
      } else {
        throw new Error(`Unknown type: ${type}`);
      }
    } finally {
      // remove temp file
      await $con(FS).rm(tempFile);
    }
  }

  getConnection(user: ClusterUser) {
    return this.$(user);
  }

  async deploy(
    name: string,
    runner: ClusterUser,
    manager: DockerNode,
    options: { yaml: string; type?: 'swarm' | 'compose' },
  ) {
    const { type = 'swarm' } = options;
    const isManager = this.isEqual(manager);
    if (!isManager) {
      return;
    }

    const { yaml } = options;

    const $con = this.$(runner);

    await DockerNode.deployToConnection($con, name, yaml, type);
  }

  async run(
    service: DockerService,
    name: string,
    runner: ClusterUser,
    manager: DockerNode,
    options: {},
  ) {
    const isManager = this.isEqual(manager);
    if (!isManager) {
      return;
    }

    const profiles = service.getProfiles();

    const $con = this.$(runner);
    const dockerCompose = await $con(DockerCompose);
    const result = await dockerCompose.run(service.name, {
      rm: true,
      pull: 'always',
      detach: true,
      profile: profiles,
    });

    logDeploy('deploy result', result);
  }

  async setup(
    admin: ClusterUser,
    runner: ClusterUser,
    manager: DockerNode,
    options: { token?: string },
  ) {
    if (!runner.username) {
      throw new Error('Runner user is required for docker node setup');
    }

    const isManager = this.isEqual(manager);

    const { token } = options;

    // base setup for all nodes
    await super.setup(admin, runner, manager);

    const $con = this.$(admin);

    // install docker
    await $con(Docker).install();

    // https://docs.docker.com/engine/install/linux-postinstall/
    // enable runner user to run docker commands without sudo
    await $con(Docker).allowUser(runner.username);

    // start docker service
    await $con(Docker).start();

    // need to relogin to apply changes
    const $runner = this.$(runner);

    // https://docs.docker.com/engine/swarm/swarm-tutorial/#open-protocols-and-ports-between-the-hosts
    /* allow docker swarm management port
    •	TCP port 2377: Cluster management communications
    •	TCP and UDP port 7946: Communication among nodes
    •	UDP port 4789: Overlay network traffic
    */
    // only admin can change UFW rules
    await $con(UFW).allow({ port: 2377, protocol: Protocol.TCP });
    await $con(UFW).allow({ port: 7946, protocol: Protocol.TCP });
    await $con(UFW).allow({ port: 7946, protocol: Protocol.UDP });
    await $con(UFW).allow({ port: 4789, protocol: Protocol.UDP });

    if (isManager) {
      // join swarm as manager
      const { host } = this;
      await $con(DockerSwarm).init(host);
    } else {
      if (!token) {
        throw new Error('Token is required for worker node setup');
      }
      // join as worker
      await $runner(DockerSwarm).join(token, manager.host);
    }

    /*
    // install AWS Cli
    await $con(AWS).install();
    await $con(AWS).setCredentials(aws.accessKeyId, aws.secretAccessKey);
    await $con(AWS).setDefaultRegion(aws.defaultRegion);
    */
  }

  async getWorkerToken(runner: ClusterUser) {
    const $con = this.$(runner);

    return $con(DockerSwarm).getWorkerToken();
  }

  async authenticateRegistries(user: ClusterUser, registries: Registry[], manager: ClusterNode) {
    // only manager is doing authentication
    if (this !== manager) {
      return;
    }

    const $con = this.$(user);

    await Promise.all(registries.map((registry) => registry.login($con)));
  }

  async connect(user: ClusterUser, options: { forward?: boolean } = {}) {
    const { forward = false } = options;

    const { host } = this;
    const { username } = user;

    const sshArgs = [
      '-o IdentitiesOnly=yes',
      '-o PasswordAuthentication=no',
      '-o BatchMode=yes',
      `${username}@${host}`,
    ];

    const privateKey = await user.getPrivateKey();
    let tempKeyFile: string | undefined;
    if (privateKey) {
      tempKeyFile = await $(FS).temp();

      await $(FS).writeFile(tempKeyFile, privateKey, { mode: 0o600 }); // Set proper permissions

      sshArgs.unshift('-i', tempKeyFile);
    }

    let cleanupCalled = false;

    function cleanup() {
      if (cleanupCalled) {
        return;
      }

      cleanupCalled = true;

      if (tempKeyFile) {
        $(FS).rm(tempKeyFile);
      }
    }

    await new Promise(async (resolve, reject) => {
      const ssh = spawn('ssh', sshArgs, {
        stdio: 'inherit',
        env: process.env,
      });

      // cleanup when ssh process is started
      ssh.on('data', function () {
        cleanup();
      });

      ssh.on('exit', (code) => {
        cleanup();

        if (code !== 0) {
          reject(new Error(`SSH exited with code ${code}`));
        } else {
          resolve(undefined);
        }
      });
    });
  }
}
