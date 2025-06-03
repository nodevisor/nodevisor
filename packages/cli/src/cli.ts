#!/usr/bin/env node

import { Command } from 'commander';
import * as tsNode from 'ts-node';
import * as fs from 'node:fs';
import { generateKey, expandHomeDir } from '@nodevisor/core';
import { version } from '../package.json';
import getCluster from './utils/getCluster';

const program = new Command();

tsNode.register({
  transpileOnly: true,
  compilerOptions: {
    module: 'NodeNext', // Set the module system to NodeNext
    moduleResolution: 'NodeNext', // Set the module resolution to NodeNext
    target: 'ESNext', // Optional: Modern JavaScript target
    esModuleInterop: true, // Enable interop between CommonJS and ESM
  },
});

// CLI configuration
program
  .name('nodevisor-cli')
  .description('Nodevisor CLI to automate server setup')
  .version(version);

program
  .command('setup')
  .description('Setup and secure your servers and install depedencies')
  .argument('<file>', 'Your cluster definition')
  .option('-g, --generate-keys', 'Generate new SSH keys')
  .option('-i, --identity <path>', 'Path to SSH key', '~/.ssh/nodevisor_id_ed25519')
  .option('-p, --passphrase <passphrase>', 'Passphrase for private key')
  .action(async (file, options) => {
    try {
      if (options.generateKeys) {
        const { identity } = options;
        if (!identity) {
          throw new Error('Error: --identity is required when --generate is used');
        }

        const identityPath = expandHomeDir(identity);

        if (fs.existsSync(identityPath)) {
          console.log(`Identity file ${identityPath} already exists. Skipping generation.`);
        } else {
          const passphrase = options.passphrase ? options.passphrase : undefined;
          await generateKey(identityPath, passphrase);
        }
      }

      const cluster = await getCluster(file);
      await cluster.setup();
      process.exit(0);
    } catch (error: unknown) {
      console.error(`Error while executing ${file}:`, (error as Error).message);
      console.error((error as Error).stack);
      process.exit(1);
    }
  });

program
  .command('deploy')
  .description('Deploy cluster')
  .argument('<file>', 'Your cluster definition')
  .option('--no-build', 'Skip build step')
  .option('-l, --local', 'Deploy cluster to local docker daemon')
  .option('-s, --service <service...>', 'Services to deploy')
  .action(async (file, options) => {
    try {
      const cluster = await getCluster(file);

      if (options.local) {
        await cluster.deployLocal({
          services: options.service,
          skipBuild: !options.build,
        });
      } else {
        await cluster.deploy({
          services: options.service,
          skipBuild: !options.build,
        });
      }

      process.exit(0);
    } catch (error: unknown) {
      console.error(`Error while executing ${file}:`, (error as Error).message);
      console.error((error as Error).stack);
      process.exit(1);
    }
  });

program
  .command('connect')
  .description('Connect to master node and forward ports to local machine')
  .argument('<file>', 'Your cluster definition')
  .option('-f, --forward', 'Forward all ports to local machine')
  .action(async (file, options) => {
    try {
      const cluster = await getCluster(file);

      await cluster.connect({
        forward: options.forward || false,
      });
      process.exit(0);
    } catch (error: unknown) {
      console.error(`Error while executing ${file}:`, (error as Error).message);
      console.error((error as Error).stack);
      process.exit(1);
    }
  });

program
  .command('run')
  .description('Run service')
  .argument('<file>', 'Your cluster definition')
  .option('-s, --service <service...>', 'Services to run')
  .option('--no-build', 'Skip build step')
  .action(async (file, options) => {
    try {
      const cluster = await getCluster(file);

      await cluster.run({
        services: options.service,
        skipBuild: !options.build,
      });

      process.exit(0);
    } catch (error: unknown) {
      console.error(`Error while executing ${file}:`, (error as Error).message);
      console.error((error as Error).stack);
      process.exit(1);
    }
  });

program.parse(process.argv);
