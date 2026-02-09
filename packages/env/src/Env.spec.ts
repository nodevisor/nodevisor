import path from 'path';
import $, { Module } from '@nodevisor/shell';
import Env from './Env';

describe('Env Module', () => {
  let env: Env;

  beforeAll(() => {
    env = new Env();
  });

  it('should return the environment variable value', async () => {
    const home = await env.get('HOME');

    expect(home).toBeDefined();
    expect(home).not.toBeNull();
    expect(home).not.toBe('');
  });

  it('should set the environment variable', async () => {
    const currentValue = await env.get('TEST_VAR');

    expect(currentValue).toBeUndefined();

    // random value
    const newValue = Math.random().toString(36).substring(7);
    await env.set('TEST_VAR', newValue);

    const valueFromEnv = await env.get('TEST_VAR');
    expect(valueFromEnv).toBe(newValue);

    const printEnvFromSystem = await env.connection.cmd({}).getEnv('TEST_VAR', true);
    // it is saved in env not in system
    expect(printEnvFromSystem).toBeUndefined();

    await env.unset('TEST_VAR');
    const unsetedValue = await env.get('TEST_VAR');
    expect(unsetedValue).toBeUndefined();

    const printEnvFromSystem2 = await env.connection.cmd({}).getEnv('TEST_VAR', true); //(await env.$`printf "%s" $TEST_VAR`.text()) || undefined;
    expect(printEnvFromSystem2).toBeUndefined();
  });
  /*
  it('should load the environment variables from the file .test', async () => {
    await env.load(path.join(__dirname, '.test'));

    const value = await env.get('FILE_TEST_VAR');
    expect(value).toBe('test-file-value');
  });


  it('should be able to use specific username to get env variable', async () => {
    class Paths extends Module<{
      value: string;
    }> {
      readonly name = 'MyModule';
      readonly env = new Env(this.nodevisor);

      async getAuthorizedKeysPath() {
        const homeDir = await this.env.home();
        return this.$`printf ${homeDir}/.ssh/authorized_keys`;
      }
    }

    const $user = $.as({ user: 'seeden', method: 'sudo' });
    const value = await $user(Paths).getAuthorizedKeysPath();

    console.log('value', value);
  });
  /*
  it('should unset the environment variable', async () => {
    // Mock the shell execution for unsetEnv
    mockShell.mockReturnValueOnce({
      unsetEnv: jest.fn().mockResolvedValue(),
    });

    await env.unset('TEST_VAR');
    expect(mockShell).toHaveBeenCalledWith``;
    expect(mockShell().unsetEnv).toHaveBeenCalledWith('TEST_VAR', true);
  });
  */

  /*
    it('should return the HOME environment variable', async () => {
      // Mock the getEnv method to return a HOME value
      mockShell.mockReturnValueOnce({
        getEnv: jest.fn().mockResolvedValue('/home/user'),
      });

      const result = await env.home();
      expect(result).toBe('/home/user');
    });

    it('should throw an error if HOME is not set', async () => {
      // Mock the getEnv method to return undefined
      mockShell.mockReturnValueOnce({
        getEnv: jest.fn().mockResolvedValue(undefined),
      });

      await expect(env.home()).rejects.toThrow('HOME environment variable not set');
    });


  describe('load method', () => {
    it('should load the environment variables from the file', async () => {
      // Mock shell execution for load process
      mockShell.mockResolvedValue({});

      await env.load('/path/to/env/file');

      expect(mockShell).toHaveBeenCalledWith`set -a`;
      expect(mockShell).toHaveBeenCalledWith`source /path/to/env/file`;
      expect(mockShell).toHaveBeenCalledWith`set +a`;
    });
  });
  */
});
