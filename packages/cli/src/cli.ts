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

// CLI configuration
program
  .version('0.1.0')
  .description('Nodevisor CLI to automate server setup')
  .argument('<file>', 'TypeScript file to execute')
  .option('-e, --env <path>', 'Path to .env file', '.env')
  .action(async (file, options) => {
    const filePath = path.resolve(file);

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      console.error(`Error: File ${filePath} not found.`);
      process.exit(1);
    }

    const envPath = options.env;
    const envVars: Record<string, string> = {};

    if (envPath) {
      if (!fs.existsSync(path.resolve(envPath))) {
        console.error(`Error: File ${envPath} not found.`);
        process.exit(1);
      }

      // Load environment variables from the custom .env path
      const result = dotenv.config({ path: path.resolve(envPath) });
      if (result.error) {
        console.error('Error loading .env file:', result.error);
        process.exit(1);
      }
      Object.assign(envVars, result.parsed);
    }

    try {
      const module = require(filePath);
      const { default: fn, schema } = module;

      const parsed = schema ? schema.parse(envVars) : envVars;
      await fn(parsed);
    } catch (error) {
      console.error(`Error while executing ${file}:`, (error as Error).message);
    }
  });

program.parse(process.argv);
