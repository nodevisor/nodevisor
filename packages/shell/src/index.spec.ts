import $ from './index';

describe('$', () => {
  it('should be able to use $ as a function', async () => {
    const response = await $`printf ${'Hello World'}`.text();

    expect(response).toEqual('Hello World');
  });
});

describe('shell', () => {
  /*
  it('should be able to use local shell as a function', async () => {
    const response = await shell.$`echo ${'Hello World'}`;

    expect(response).toBe('Hello World');
  });
  */
});
