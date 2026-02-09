import which from 'which';
import PWSH from './PWSH';
import { Nodevisor } from '@nodevisor/shell';

// detect if pwsh is available
const hasPwsh = which.sync('pwsh', { nothrow: true });
const itIfPwsh = hasPwsh ? it : xit;

describe('PWSH Module', () => {
  let pwsh: PWSH;
  let nodevisor: Nodevisor;

  beforeAll(() => {
    nodevisor = new Nodevisor();
    pwsh = new PWSH(nodevisor);
  });

  it('should escape command', async () => {
    const result = pwsh.command`Get-Command ls`.toString();

    expect(result).toBe('pwsh -Command "Get-Command ls"');
  });

  it('should escape command with variables', async () => {
    const command = 'ls';
    const result = pwsh.command`Get-Command ${command}`.toString();

    expect(result).toBe('pwsh -Command "Get-Command ls"');
  });

  it('should escape command with text variables', async () => {
    const command = "hello ' world";
    const result = pwsh.command`echo ${command}`.toString();

    expect(result).toBe("pwsh -Command \"echo 'hello '' world'\"");
  });
});
