import fs from 'node:fs/promises';
import { constants } from 'node:fs';

export default async function canReadFile(filePath: string) {
  try {
    await fs.access(filePath, constants.R_OK);
    return true;
  } catch (error) {
    return false;
  }
}
