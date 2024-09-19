import $ from './index';

describe('$', () => {
  it('should be able to use $ as a function', async () => {
    const response = await $`echo ${'Hello World'}`;

    expect(response).toBe('Hello World');
  });
});

describe('nodevisor', () => {
  /*
  it('should be able to use local nodevisor as a function', async () => {
    const response = await nodevisor.$`echo ${'Hello World'}`;

    expect(response).toBe('Hello World');
  });
  */
});
