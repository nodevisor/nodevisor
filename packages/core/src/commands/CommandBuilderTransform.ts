import CommandBuilder from './CommandBuilder';

export default class CommandBuilderTransform<ReturnValue> implements PromiseLike<ReturnValue> {
  private commandBuilder: PromiseLike<string>;

  constructor(commandBuilder: CommandBuilder) {
    this.commandBuilder = commandBuilder;
  }

  toString() {
    return this.commandBuilder.toString();
  }

  async exec(): Promise<ReturnValue> {
    const result = await this.commandBuilder;

    return result as unknown as ReturnValue;
  }

  then<TResult1 = ReturnValue, TResult2 = never>(
    onfulfilled?: ((value: ReturnValue) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
  ): Promise<TResult1 | TResult2> {
    return this.exec().then(onfulfilled, onrejected);
  }
}
