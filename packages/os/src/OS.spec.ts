import { hostname, arch, platform, uptime } from 'os';
import OS from './OS';
import Arch from './constants/Arch';
import { Nodevisor } from '@nodevisor/core';


describe('OS Module', () => {
  let os: OS;
  let nodevisor: Nodevisor;
  
  beforeAll(() => {
    nodevisor = new Nodevisor();
    os = new OS(nodevisor);
  });

  it('should execute uptime command', async () => {
    const result = await os.uptime();
    const nodejsUptime = await os.uptime();

    const diff = Math.abs(result - nodejsUptime);

    expect(diff).toBeLessThan(1);
  });

  it('should execute hostname command', async () => {
    const result = await os.hostname();

    expect(result).toBe(hostname());
  });

  it('should execute arch command', async () => {
    const result = await os.arch();

    const archMap: Record<string, Arch> = {
      'x86_64': Arch.X64,
    };

    const converted = archMap[result] || result;

    expect(converted).toBe(arch());
  });

  it('should execute platform command', async () => {
    const result = await os.platform();

    expect(result).toBe(platform());
  });
});
