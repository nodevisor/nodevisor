import CommandOutput from './CommandOutput';

describe('CommandOutput Class', () => {
  const createOutput = (overrides = {}) => {
    return new CommandOutput({
      stdout: 'test output',
      stderr: 'test error',
      code: 0,
      duration: 100,
      ...overrides,
    });
  };

  it('should construct with default values', () => {
    const output = createOutput();

    expect(output.stdout).toBe('test output');
    expect(output.stderr).toBe('test error');
    expect(output.code).toBe(0);
    expect(output.duration).toBe(100);
  });

  it('should apply transforms on output', () => {
    const output = createOutput({ stdout: '  Some output \n\n' });

    const result = output.toString();
    expect(result).toBe('  Some output ');
  });

  it('should throw an error for non-zero code in constructor', () => {
    expect(() => createOutput({ code: 1, stderr: 'command failed' })).toThrow(
      'Use CommandOutputError for error outputs.',
    );
  });

  it('should correctly apply the toBoolean method based on code', () => {
    const successOutput = createOutput({ code: 0 });
    //const failOutput = createOutput({ code: 1 });

    expect(successOutput.boolean(true)).toBe(true);
    //expect(failOutput.boolean(true)).toBe(false);
  });

  it('should split output into lines', () => {
    const multilineOutput = createOutput({ stdout: 'line1\nline2\nline3' });

    expect(multilineOutput.lines()).toEqual(['line1', 'line2', 'line3']);
  });

  it('should return output as a buffer', () => {
    const output = createOutput();

    const buffer = output.buffer();
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.toString()).toBe('test output');
  });

  it('should apply trim transformation', () => {
    const output = createOutput({ stdout: '   padded string   ', transforms: ['trim'] });

    expect(output.toString()).toBe('padded string');
  });

  it('should convert to text with different encodings', () => {
    const output = createOutput();

    expect(output.text('utf8')).toBe('test output');
    expect(output.text('ascii')).toBe(Buffer.from('test output').toString('ascii'));
  });

  it('should apply toLowerCase transform correctly', () => {
    const output = createOutput({ stdout: 'UPPERCASE', transforms: ['toLowerCase'] });

    expect(output.toString()).toBe('uppercase');
  });

  it('should correctly handle Blob creation', () => {
    if (typeof Blob !== 'undefined') {
      const output = createOutput();
      const blob = output.blob();

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    } else {
      expect(() => createOutput().blob()).toThrow('Blob is not supported.');
    }
  });

  it('should handle transformation management (add/remove transformations)', () => {
    const output = createOutput();

    output.trim(true);
    expect(output.toString()).toBe('test output');

    output.toLowerCase(true);
    expect(output.toString()).toBe('test output');
  });
});
