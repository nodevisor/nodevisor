import { type Encoding } from 'node:crypto';
import type CommandOutput from './CommandOutput';
import CommandOutputTypeBuilder from './CommandOutputTypeBuilder';

/*
  we can not use
    - return proxy from constructor because types will not work
    - create OutputPromise extends Promise<CommandOutput> because typescript will ignore it and use Promise<CommandOutput> without our methods
  therefore we need to use another class as builder
*/
export default class CommandOutputBuilder extends CommandOutputTypeBuilder<CommandOutput> {
  text(encoding: Encoding = 'utf8') {
    return new CommandOutputTypeBuilder(
      this.then((output: CommandOutput) => output.text(encoding)),
    );
  }

  buffer() {
    return new CommandOutputTypeBuilder(this.then((output: CommandOutput) => output.buffer()));
  }

  json<T = any>() {
    return new CommandOutputTypeBuilder(this.then((output: CommandOutput) => output.json<T>()));
  }

  blob(type = 'text/plain') {
    return new CommandOutputTypeBuilder(this.then((output: CommandOutput) => output.blob(type)));
  }

  lines() {
    return new CommandOutputTypeBuilder(this.then((output: CommandOutput) => output.lines()));
  }

  boolean(useCode?: boolean) {
    return new CommandOutputTypeBuilder(
      this.then((output: CommandOutput) => output.boolean(useCode)),
    );
  }

  // transform methods
  sanitize(enable = true) {
    return new CommandOutputBuilder(this.then((output) => output.sanitize(enable)));
  }

  trim(enable = true) {
    return new CommandOutputBuilder(this.then((output) => output.trim(enable)));
  }

  trimEnd(enable = true) {
    return new CommandOutputBuilder(this.then((output) => output.trimEnd(enable)));
  }

  toLowerCase(enable = true) {
    return new CommandOutputBuilder(this.then((output) => output.toLowerCase(enable)));
  }
}
