import { hostname, arch } from 'os';
import OS from './OS';
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

    expect(result).toContain('up');
    expect(result).toContain('days');
    expect(result).toContain('load averages');
  });

  it('should execute hostname command', async () => {
    const result = await os.hostname();

    expect(result).toBe(hostname());
  });

  it('should execute arch command', async () => {
    const result = await os.arch();

    expect(result).toBe(arch());
  });
/*
  it('should execute platform command', async () => {
    nodevisorMock.$.mockResolvedValueOnce('Linux');
    const result = await os.platform();

    expect(nodevisorMock.$).toHaveBeenCalledWith`uname -s`;
    expect(result).toBe('Linux');
  });
  */
});