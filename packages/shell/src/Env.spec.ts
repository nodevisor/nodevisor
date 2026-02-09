import Env from './Env';

describe('Env', () => {
  it('should initialize with an empty Map and Set', () => {
    const envInstance = new Env();
    expect(envInstance.isEmpty()).toBe(true);
    expect(envInstance.getFiles()).toHaveLength(0);
  });

  it('should initialize with an existing Env instance', () => {
    const existingEnv = new Env({ TEST: 'value' });
    existingEnv.addFile('/path/to/file');

    const newEnvInstance = new Env(existingEnv);

    expect(newEnvInstance.get('TEST')).toBe('value');
    expect(newEnvInstance.getFiles()).toContain('/path/to/file');
  });

  it('should initialize with a record of environment variables', () => {
    const envVars: Record<string, string | undefined> = {
      TEST_VAR: 'test_value',
      ANOTHER_VAR: 'another_value',
    };
    const newEnvInstance = new Env(envVars);

    expect(newEnvInstance.get('TEST_VAR')).toBe('test_value');
    expect(newEnvInstance.get('ANOTHER_VAR')).toBe('another_value');
  });

  it('should return the value for an existing key', () => {
    const envInstance = new Env();
    envInstance.set('TEST', 'value');
    expect(envInstance.get('TEST')).toBe('value');
  });

  it('should return undefined for a non-existing key', () => {
    const envInstance = new Env();
    expect(envInstance.get('NON_EXISTENT')).toBeUndefined();
  });

  it('should set multiple key-value pairs when passed an object', () => {
    const values = {
      TEST1: 'value1',
      TEST2: 'value2',
    };

    const envInstance = new Env();
    envInstance.set(values);
    expect(envInstance.get('TEST1')).toBe('value1');
    expect(envInstance.get('TEST2')).toBe('value2');
  });

  it('should overwrite existing values for keys', () => {
    const envInstance = new Env();
    envInstance.set('TEST', 'initial');
    envInstance.set('TEST', 'updated');
    expect(envInstance.get('TEST')).toBe('updated');
  });

  it('should return true if the key exists', () => {
    const envInstance = new Env();
    envInstance.set('TEST', 'value');
    expect(envInstance.has('TEST')).toBe(true);
  });

  it('should return false if the key does not exist', () => {
    const envInstance = new Env();
    expect(envInstance.has('NON_EXISTENT')).toBe(false);
  });

  it('should remove a key by setting its value to undefined', () => {
    const envInstance = new Env();
    envInstance.set('TEST', 'value');
    envInstance.delete('TEST');
    expect(envInstance.get('TEST')).toBeUndefined();
  });

  it('should clear all environment variables and files', () => {
    const envInstance = new Env();
    envInstance.set('TEST', 'value');
    envInstance.addFile('/path/to/file');
    envInstance.clear();
    expect(envInstance.isEmpty()).toBe(true);
    expect(envInstance.getFiles()).toHaveLength(0);
  });

  describe('isEmpty', () => {
    it('should return true if there are no environment variables or files', () => {
      const envInstance = new Env();
      expect(envInstance.isEmpty()).toBe(true);
    });

    it('should return false if there are environment variables', () => {
      const envInstance = new Env();
      envInstance.set('TEST', 'value');
      expect(envInstance.isEmpty()).toBe(false);
    });

    it('should return false if there are files', () => {
      const envInstance = new Env();
      envInstance.addFile('/path/to/file');
      expect(envInstance.isEmpty()).toBe(false);
    });
  });

  describe('toObject', () => {
    it('should convert the env Map to an object', () => {
      const envInstance = new Env();
      envInstance.set('TEST1', 'value1');
      envInstance.set('TEST2', 'value2');
      expect(envInstance.toObject()).toEqual({
        TEST1: 'value1',
        TEST2: 'value2',
      });
    });
  });

  // File management related tests
  describe('addFile', () => {
    it('should add a file path to the files set', () => {
      const envInstance = new Env();
      envInstance.addFile('/path/to/file');
      expect(envInstance.getFiles()).toContain('/path/to/file');
    });
  });

  describe('deleteFile', () => {
    it('should remove a file path from the files set', () => {
      const envInstance = new Env();
      envInstance.addFile('/path/to/file');
      envInstance.deleteFile('/path/to/file');
      expect(envInstance.getFiles()).not.toContain('/path/to/file');
    });
  });

  describe('getFiles', () => {
    it('should return an array of file paths', () => {
      const envInstance = new Env();
      envInstance.addFile('/path/to/file1');
      envInstance.addFile('/path/to/file2');
      expect(envInstance.getFiles()).toEqual(['/path/to/file1', '/path/to/file2']);
    });
  });
});
