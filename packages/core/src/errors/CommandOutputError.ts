import CommandOutput, { type CommandOutputOptions } from '../commands/CommandOutput';

export default class CommandOutputError extends CommandOutput implements Error {
  name: string = 'CommandOutputError';
  message: string;
  stack?: string;

  constructor(options: CommandOutputOptions) {
    super(options);

    this.message = this.stderr;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(this.message).stack;
    }
  }
}
