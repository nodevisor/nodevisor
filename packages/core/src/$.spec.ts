import $ from './$';
import Module from './Module';

class MyModule extends Module<{
  value: string;
}> {
  readonly name = 'MyModule';

  test() {
    return this.$`printf ${this.config.value}`;
  }
}

describe('Shell execution', () => {
  it('should execute a command', async () => {
    const result = await $`printf ${'Hello, world!'}`.text();
    expect(result).toBe('Hello, world!');

    const resultWithMultuple = $`echo ${'Hello, world!'} as ${'runner'}`.setShellQuote().toString();
    expect(resultWithMultuple).toBe("echo $'Hello, world!' as runner");

    const resultSimple = await $`printf "Hello, world!"`.text();
    expect(resultSimple).toBe('Hello, world!');

    const testResult = await $(MyModule, { value: 'Hello, world! Test' }).test().text();
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
    expect(cmd).toBe("su - runner -c $'printf $\\'Hello, world! Runner\\''");

    const myModuleRunner = new MyModule($runner);
    myModuleRunner.test();
    // myModuleRunner.test2();

    $runner(myModuleRunner).test();
  });
});
