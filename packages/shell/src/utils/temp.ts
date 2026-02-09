import fs from 'node:fs/promises';

import tmp from 'tmp';

tmp.setGracefulCleanup();

export function file(content: string = '') {
  return new Promise<string>((resolve, reject) => {
    tmp.file(async (err, path: string) => {
      if (err) {
        reject(err);
      } else {
        if (content) {
          await fs.writeFile(path, content);
        }
        resolve(path);
      }
    });
  });
}
