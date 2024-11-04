#!/usr/bin/env node
import { Command } from 'commander';
import * as tsNode from 'ts-node';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as dotenv from 'dotenv';

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

function loadEnvFile(envPath: string): Record<string, string> {
  if (fs.existsSync(envPath)) {
    const result = dotenv.config({ path: envPath });
    if (result.error) {
      throw new Error(`Error loading .env file from ${envPath}: ${result.error}`);
    }

    return result.parsed || {};
  } else {
    return {};
  }
}

// CLI configuration
program
  .version('0.1.0')
  .description('Nodevisor CLI to automate server setup')
  .argument('<file>', 'TypeScript file to execute')
  .option('-e, --env <path>', 'Path to .env file')
  .option('-d, --deploy', 'Deploy cluster')
  .option('-s, --setup', 'Setup cluster')
  .action(async (file, options) => {
    try {
      let filePath = path.resolve(file);
      const hasDirectorySeparator = file.includes(path.sep);

      // try to use file from ./.nodevisor/ directory
      if (!path.isAbsolute(file) && !hasDirectorySeparator) {
        const nodevisorDir = path.resolve('.nodevisor');
        const nodevisorFilePath = path.join(nodevisorDir, file);

        // Check if .nodevisor directory exists and file is inside it
        if (fs.existsSync(nodevisorDir) && fs.existsSync(nodevisorFilePath)) {
          filePath = nodevisorFilePath; // Use the file from .nodevisor directory
        }
      }

      if (!fs.existsSync(filePath)) {
        throw new Error(`Error: File ${filePath} not found.`);
      }

      // load env variables
      let envVars: Record<string, string> = {};
      if (options.env) {
        // Load from the specified --env path
        envVars = loadEnvFile(path.resolve(options.env));
      } else {
        // Automatically load .env from the same directory as the TypeScript file
        const envPath = path.join(path.dirname(filePath), '.env');
        envVars = loadEnvFile(envPath);
      }

      // run typescript code
      const module = require(filePath);
      const { default: fn, schema } = module;

      const parsed = schema ? schema.parse(envVars) : envVars;
      const result = await fn(parsed);

      if (options.deploy) {
        await result.deploy();
      }

      if (options.setup) {
        await result.setup();
      }

      process.exit(0);
    } catch (error) {
      console.error(`Error while executing ${file}:`, (error as Error).message);
      process.exit(1);
    }
  });

program.parse(process.argv);
