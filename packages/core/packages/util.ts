import type Connection from '../Connection';

export function transform(connection: Connection, fn: (command: string) => string) {
  const { cmd, exec } = connection;

  return (strings: TemplateStringsArray, ...values: any[]) => {
    const command = cmd(strings, ...values);

    return exec(fn(command));
  };
}

export function process<TResponse>(connection: Connection, fn: (response: string) => TResponse) {
  const { cmd, exec } = connection;

  return async (strings: TemplateStringsArray, ...values: any[]) => {
    const command = cmd(strings, ...values);

    const result = await exec(command);

    return fn(result);
  };
}

export function transformAndProcess<TResponse>(
  connection: Connection,
  modifyFn: (command: string) => string,
  processFn: (response: string) => TResponse,
) {
  const { cmd, exec } = connection;

  return async (strings: TemplateStringsArray, ...values: any[]) => {
    const command = cmd(strings, ...values);

    const result = await exec(modifyFn(command));

    return processFn(result);
  };
}

export function bool(connection: Connection) {
  return transformAndProcess(
    connection,
    (command) => `${command} > /dev/null 2>&1 && echo "true" || echo "false"`,
    (response) => response.trim() === 'true',
  );
}

export function lines(connection: Connection) {
  return process(connection, (result) => result.trim().split('\n'));
}
