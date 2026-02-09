import tmp from 'tmp';
import fs from 'fs/promises';

// Automatically clean up temp files when the process exits
tmp.setGracefulCleanup();

export function createTempFile() {
  const tempFile = tmp.fileSync(); // Creates a temp file that is auto-cleaned up
  return tempFile.name;
}

export function createTempDir() {
  const tempDir = tmp.dirSync(); // Creates a temp directory that is auto-cleaned up
  return tempDir.name;
}
