import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';

export default async function getCluster(file: string) {
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

  // Automatically load .env from the same directory as the TypeScript file
  const envPath = path.join(path.dirname(filePath), '.env');
  if (fs.existsSync(envPath)) {
    const result = dotenv.config({ path: envPath });
    if (result.error) {
      throw new Error(`Error loading .env file from ${envPath}: ${result.error}`);
    }
  }

  // run typescript code
  const module = require(filePath);
  const cluster = module.default;

  if (!cluster) {
    throw new Error('Error: Cluster file did not export default cluster');
  }

  return cluster;
}
