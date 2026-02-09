import { CommandBuilder, ShellConnection, raw } from '@nodevisor/shell';
import type DockerHealthcheckConfig from './@types/DockerHealthcheckConfig';
import type Duration from './@types/Duration';

export default class DockerHealthcheck {
  readonly command = new CommandBuilder(new ShellConnection()).setShellQuote();
  private config: Omit<DockerHealthcheckConfig, 'test'>;

  constructor(config: DockerHealthcheckConfig) {
    const { test, ...rest } = config;

    this.config = rest;

    if (test) {
      this.command.append`${raw(test)}`;
    }
  }

  set interval(interval: Duration | undefined) {
    this.config.interval = interval;
  }

  get interval(): Duration | undefined {
    return this.config.interval ?? '';
  }

  set timeout(timeout: Duration | undefined) {
    this.config.timeout = timeout;
  }

  get timeout(): Duration | undefined {
    return this.config.timeout;
  }

  set retries(retries: number | undefined) {
    this.config.retries = retries;
  }

  get retries(): number | undefined {
    return this.config.retries;
  }

  set startPeriod(start_period: Duration | undefined) {
    this.config.start_period = start_period;
  }

  get startPeriod(): Duration | undefined {
    return this.config.start_period;
  }

  isEnabled() {
    return !this.config.disable;
  }

  isActive() {
    const { command } = this;
    const { disable, ...rest } = this.config;

    if (disable) {
      return false;
    }

    return this.hasCommand();
  }

  set(strings: TemplateStringsArray, ...values: any[]) {
    this.command.set(strings, ...values);
    return this;
  }

  getCommand() {
    return this.command.clone();
  }

  hasCommand() {
    // command can be filled during getCommand
    const command = this.getCommand();
    return !command.isEmpty();
  }

  toCompose(): DockerHealthcheckConfig | undefined {
    const { disable, ...rest } = this.config;

    if (disable) {
      return {
        disable,
      };
    }

    if (!this.hasCommand()) {
      return undefined;
    }

    return {
      ...rest,
      test: this.command.toString(),
    };
  }
}
