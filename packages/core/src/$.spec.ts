import $ from './$';
import Module, { type ModuleConfig } from './Module';

class MyModule extends Module {
  readonly name = 'MyModule';
  private value: string;

  constructor(
    config: ModuleConfig & {
      value: string;
    },
  ) {
    const { value, ...rest } = config;
    super(rest);

    this.value = value;
  }

  test() {
    return this.$`echo ${this.value}`;
  }
}

describe('Shell execution', () => {
  it('should execute a command', async () => {
    const result = await $`echo ${'Hello, world!'}`;
    expect(result).toBe('Hello, world!');

    const resultWithMultuple = $`echo ${'Hello, world!'} as ${'runner'}`.setShellQuote().toString();
    expect(resultWithMultuple).toBe("echo $'Hello, world!' as runner");

    const resultSimple = await $`echo "Hello, world!"`;
    expect(resultSimple).toBe('Hello, world!');

    const testResult = await $(MyModule, { value: 'Hello, world! Test' }).test();
    expect(testResult).toBe('Hello, world! Test');

    const resultWithAs = $({ as: 'runner' })`echo 'omg'`.setShellQuote().toString();
    expect(resultWithAs).toBe("su - runner -c $'echo \\'omg\\''");

    const $con = $.connect({
      host: '127.0.0.1',
      username: 'runner',
      password: 'test',
    });

    expect($con).toBeDefined();

    const $runner = $({ as: 'runner' });

    const myModule = $runner(MyModule, { value: 'Hello, world! Runner' });
    const cmd = myModule.test().setShellQuote().toString();
    expect(cmd).toBe("su - runner -c $'echo $\\'Hello, world! Runner\\''");
  });
});
