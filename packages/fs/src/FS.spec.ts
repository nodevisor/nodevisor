import { tmpdir } from 'node:os';
import nodevisor from '@nodevisor/core';
import FS from './FS';

describe('FS Module', () => {
  let fs: FS;
  
  beforeAll(() => {
    fs = new FS(nodevisor);
  });

  it('should execute exists command', async () => {
    const tmp = tmpdir();
    const dirname = 'test-' + Math.random().toString(36).substring(7);

    const path = `${tmp}/${dirname}`;

    expect(await fs.exists(path)).toBe(false);

    await fs.mkdir(path);

    expect(await fs.exists(path)).toBe(true);
  });

  it('should create a temporary file', async () => {
    const tmpFile = await fs.temp();
    expect(await fs.exists(tmpFile)).toBe(true);

    await fs.rm(tmpFile);
    expect(await fs.exists(tmpFile)).toBe(false);
  });

  it('should create a temporary directory', async () => {
    const tmpDir = await fs.tempDir();
    expect(await fs.exists(tmpDir)).toBe(true);

    await fs.rmdir(tmpDir);
    expect(await fs.exists(tmpDir)).toBe(false);
  });

  /*
  it('should get file stats', async () => {
    const filePath = await fs.temp();

    await fs.write(filePath, 'File stats');
    const statResult = await fs.stat(filePath);

    expect(statResult).toContain('File:');
  });
  */
});
