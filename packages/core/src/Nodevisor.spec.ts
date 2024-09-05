import Nodevisor from './Nodevisor';
import SSHConnection from './connections/SSHConnection';
import ShellConnection from './connections/ShellConnection';

describe('Nodevisor', () => {
  it('should create a ShellConnection if no username is provided', () => {
    const nodevisor = new Nodevisor();
    expect(nodevisor.connection).toBeInstanceOf(ShellConnection);
  });

  it('should create an SSHConnection if username is provided', () => {
    const nodevisor = new Nodevisor({
      username: 'testuser',
    });
    expect(nodevisor.connection).toBeInstanceOf(SSHConnection);
  });

  it('should execute a command using the connection', async () => {
    const nodevisor = new Nodevisor();
    const result = await nodevisor.exec('printf "Hello, world!"');

    expect(result).toBe('Hello, world!');
  });

  it('should generate a command as another user with su', async () => {
    const nodevisor = new Nodevisor({ execAs: 'testuser', execAsMethod: 'su' });

    const cmd = await nodevisor.cmd`whoami`;

    expect(cmd).toBe("su - testuser -c whoami");
  });

  it('should generate a command as another user with su and escape correctly', async () => {
    const nodevisor = new Nodevisor({ execAs: 'testuser', execAsMethod: 'runuser' });

    const cmd = await nodevisor.cmd`printf "Hello, world!"`;

    expect(cmd).toBe("runuser -l testuser -c $'printf \"Hello, world!\"'");
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