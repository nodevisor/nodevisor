import { hostname, arch } from 'os';
import OS from './OS';
import { Module, Nodevisor } from '@nodevisor/core';

type Arch =
  | 'arm'
  | 'arm64'
  | 'ia32'
  | 'loong64'
  | 'mips'
  | 'mipsel'
  | 'ppc'
  | 'ppc64'
  | 'riscv64'
  | 's390'
  | 's390x'
  | 'x64';

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
    expect(result).toContain('load averages');
  });

  it('should execute hostname command', async () => {
    const result = await os.hostname();

    expect(result).toBe(hostname());
  });

  it('should execute arch command', async () => {
    const result = await os.arch();

    // convert to Node.js arch value
    // https://documentation.ubuntu.com/lxd/en/latest/architectures/
    const archMap: Record<string, Arch> = {
      x86_64: 'x64',
      i386: 'ia32',
      i486: 'ia32',
      i586: 'ia32',
      i686: 'ia32',
      armv6l: 'arm',
      armv7l: 'arm',
      armv8l: 'arm64',
      loongarch64: 'loong64',
      mips: 'mips',
      mipsel: 'mipsel',
      ppc64: 'ppc64',
      ppc64le: 'ppc64',
      ppc: 'ppc',
      riscv64: 'riscv64',
      s390: 's390',
      s390x: 's390x',
    };

    const converted = archMap[result] || result;

    expect(converted).toBe(arch());
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