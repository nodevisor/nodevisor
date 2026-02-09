import { defaultPutOptions, defaultGetOptions, PutOptions, GetOptions } from './Connection';

describe('Connection Options', () => {
  it('should have correct default PutOptions', () => {
    const expected: PutOptions = { flags: 'w', encoding: null, mode: 0o644 };
    expect(defaultPutOptions).toEqual(expected);
  });

  it('should have correct default GetOptions', () => {
    const expected: GetOptions = { flags: 'r', encoding: null, mode: 0o644 };
    expect(defaultGetOptions).toEqual(expected);
  });
});
