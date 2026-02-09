export default class CommandOutputTypeBuilder<ReturnValue = string>
  implements PromiseLike<ReturnValue>
{
  private promise: Promise<ReturnValue>;

  constructor(promise: Promise<ReturnValue>) {
    this.promise = promise;
  }

  then<TResult1 = ReturnValue, TResult2 = never>(
    onfulfilled?: ((value: ReturnValue) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
  ): Promise<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }

  /*
  kill(killSignal: 'SIGTERM' | 'SIGKILL' | 'SIGINT' = 'SIGTERM') {

  }
  */
}
