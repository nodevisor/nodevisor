import Shell from './Shell';
import SSHConnection from './connections/SSHConnection';
import ShellConnection from './connections/ShellConnection';
import CommandOutputError from './errors/CommandOutputError';

describe('Nodevisor', () => {
  it('should create a ShellConnection if no username is provided', () => {
    const shell = new Shell();
    expect(shell.connection).toBeInstanceOf(ShellConnection);
  });

  it('should create an SSHConnection if username is provided', () => {
    const shell = new Shell({
      host: '127.0.0.1',
      username: 'runner',
    });

    expect(shell.connection).toBeInstanceOf(SSHConnection);
  });

  it('should execute a command using the connection', async () => {
    const shell = new Shell();
    const result = await shell.$`printf "Hello, world!"`.text();

    expect(result).toBe('Hello, world!');
  });

  it('should generate a command as another user with su', async () => {
    const shell = new Shell().clone({ as: 'runner' });

    const cmd = await shell.$`whoami`.setShellQuote().toString();

    expect(cmd).toBe('su - runner -c whoami');
  });

  it('should generate a command as another user and escape correctly', async () => {
    const shell = new Shell().as({ user: 'testuser', method: 'runuser' });

    const cmd = await shell.$`printf "Hello, world!"`.setShellQuote().toString();

    expect(cmd).toBe('runuser -l testuser -c $\'printf "Hello, world!"\'');

    const cmdPowerShell = await shell.$`printf "Hello, world!"`.setPowerShellQuote().toString();

    expect(cmdPowerShell).toBe('runuser -l testuser -c \'printf "Hello, world!"\'');
  });

  it('should be able to change user on the fly', async () => {
    const shell = new Shell();

    const runner = shell.as('runner');

    const cmd = await runner.$`whoami`.setShellQuote().toString();

    expect(cmd).toBe('su - runner -c whoami');
  });

  it('should generate a command as another user with su and escape correctly', async () => {
    const shell = new Shell().as({ user: 'testuser', method: 'runuser' });

    const cmd = await shell.$`printf "Hello, world!"`.setShellQuote().toString();

    expect(cmd).toBe('runuser -l testuser -c $\'printf "Hello, world!"\'');
  });

  it('should set environment variables and generate a command', async () => {
    const shell = new Shell();

    const cmd = shell.$`printf "Hello, world!"`
      .setShellQuote()
      .setEnv('FILE_TEST_VAR', 'test-file-value')
      .toString();

    expect(cmd).toBe('export FILE_TEST_VAR=test-file-value && printf "Hello, world!"');
  });

  it('should set environment variables from file', async () => {
    const shell = new Shell();
    shell.env.set('FILE_TEST_VAR', 'test-file-value');
    shell.env.addFile('/tmp/tmp-test-file');
    shell.env.addFile('/tmp/tmp-test-file2');

    const cmd = shell.$`printf "Hello, world!"`.setShellQuote().toString();

    expect(cmd).toBe(
      'export FILE_TEST_VAR=test-file-value && set -a && source /tmp/tmp-test-file && source /tmp/tmp-test-file2 && set +a && printf "Hello, world!"',
    );
  });

  it('should abort a command', async () => {
    const shell = new Shell();
    const signal = AbortSignal.timeout(1000);

    try {
      await shell.$`sleep 5`.signal(signal).text();
      throw new Error('Command should be aborted');
    } catch (e) {
      expect(e).toBeInstanceOf(CommandOutputError);
      expect((e as CommandOutputError).message).toContain('Command aborted');
    }
  });

  it('should timeout a command', async () => {
    const shell = new Shell();

    try {
      await shell.$`sleep 5`.timeout(2000).text();
      throw new Error('Command should be aborted');
    } catch (e) {
      expect(e).toBeInstanceOf(CommandOutputError);
      expect((e as CommandOutputError).message).toContain('Command timed out');
    }
  });

  /*
  it('should execute a command with environment variables', async () => {
    const execSpy = jest.spyOn(sshConnectionMock, 'exec').mockResolvedValue('Success');
    const nodevisor = new Nodevisor({ connection: sshConnectionMock });
    nodevisor.execEnv.set('MY_ENV_VAR', 'test_value');

    const result = await nodevisor.exec('echo $MY_ENV_VAR');
    expect(execSpy).toHaveBeenCalledWith(`export 'MY_ENV_VAR'='test_value' && echo $MY_ENV_VAR`);
    expect(result).toBe('Success');
  });

  it('should return a new instance when switching users using as()', () => {
    const nodevisor = new Nodevisor({ connection: shellConnectionMock });
    const newNodevisor = nodevisor.as('newuser');

    expect(newNodevisor).toBeInstanceOf(Nodevisor);
    expect(newNodevisor).not.toBe(nodevisor); // Ensure it's a new instance
    expect(newNodevisor.isOriginal()).toBe(false);
  });

  it('should return a new instance without user switching using original()', () => {
    const nodevisor = new Nodevisor({ connection: shellConnectionMock });
    const newNodevisor = nodevisor.as('newuser');

    expect(newNodevisor.isOriginal()).toBe(false);

    const originalNodevisor = newNodevisor.original();
    expect(originalNodevisor.isOriginal()).toBe(true);
  });

  it('should close the connection', async () => {
    const closeSpy = jest.spyOn(shellConnectionMock, 'close').mockResolvedValue(shellConnectionMock);
    const nodevisor = new Nodevisor({ connection: shellConnectionMock });

    await nodevisor.close();
    expect(closeSpy).toHaveBeenCalled();
  });
  */
});
