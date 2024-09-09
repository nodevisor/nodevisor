import { hostname, arch, platform, uptime } from 'os';
import OS from './OS';
import Arch from './constants/Arch';
import { Module, Nodevisor } from '@nodevisor/core';



describe('OS Module', () => {
  let os: OS;
  let nodevisor: Nodevisor;
  
  beforeEach(() => {
    nodevisor = new Nodevisor();
    os = new OS(nodevisor);
  });

  /*
  it('should execute reboot command', async () => {
    nodevisorMock.$.mockResolvedValueOnce(''); // Mock the response for reboot
    const result = await os.reboot();

    expect(nodevisorMock.$).toHaveBeenCalledWith`reboot`;
    expect(result).toBe('');
  });

  it('should execute shutdown command', async () => {
    nodevisorMock.$.mockResolvedValueOnce(''); // Mock the response for shutdown
    const result = await os.shutdown();

    expect(nodevisorMock.$).toHaveBeenCalledWith`shutdown now`;
    expect(result).toBe('');
  });
  */

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