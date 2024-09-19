import $ from './$';
import Module, { ModuleConfig } from './Module';

class MyModule extends Module {
  readonly name = 'MyModule';

  constructor(config: ModuleConfig & { lala: string }) {
    super(config);
  }

  test() {
    return this.$`echo "Hello, world!"`;
  }
}

const myModule = new MyModule({
  lala: 'lala',
});

myModule.clone({
  lala: 'lala2',
});

describe('Shell execution', () => {
  it('should execute a command', async () => {
    const result = await $`echo ${'Hello, world!'}`;
    expect(result).toBe('Hello, world!');

    const resultWithMultuple = $`echo ${'Hello, world!'} as ${'runner'}`.setShellQuote().toString();
    expect(resultWithMultuple).toBe("echo $'Hello, world!' as runner");

    const resultSimple = await $`echo "Hello, world!"`;
    expect(resultSimple).toBe('Hello, world!');

    const testResult = await $(myModule).test();
    expect(testResult).toBe('Hello, world!');

    const resultWithAs = $({ as: 'runner' })`echo 'omg'`.setShellQuote().toString();
    expect(resultWithAs).toBe("su - runner -c $'echo \\'omg\\''");

    $.connect({
      host: '127.0.0.1',
      username: 'runner',
      password: 'test',
    });
  });
});
