import os from 'node:os';
import path from 'node:path';

export default function expandHomeDir(filePath: string) {
  if (filePath.startsWith('~')) {
    return path.join(os.homedir(), filePath.slice(1)); // Replace ~ with the actual home directory
  }

  return filePath;
}
