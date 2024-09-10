import { tmpdir } from 'node:os';
import FS from './FS';
import { Nodevisor } from '@nodevisor/core';


describe('FS Module', () => {
  let fs: FS;
  let nodevisor: Nodevisor;
  
  beforeEach(() => {
    nodevisor = new Nodevisor();
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

  it('should create a temporary directory', async () => {
    const tmpDir = await fs.tempDir();
    expect(await fs.exists(tmpDir)).toBe(true);

    await fs.rmdir(tmpDir);
    expect(await fs.exists(tmpDir)).toBe(false);
  });
});
