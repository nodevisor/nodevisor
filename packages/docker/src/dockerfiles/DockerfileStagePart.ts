import type DockerfileStage from './DockerfileStage';

export default class DockerfileStagePart {
  readonly name: string;

  private lines: string[] = [];

  constructor(name: string) {
    this.name = name;
  }

  from(image: string, as?: string) {
    this.lines.push(as ? `FROM ${image} AS ${as}` : `FROM ${image}`);
    return this;
  }

  clear() {
    this.lines = [];
    return this;
  }

  comment(comment: string) {
    this.lines.push(`# ${comment}`);
    return this;
  }

  workdir(path: string) {
    this.lines.push(`WORKDIR ${path}`);
    return this;
  }

  arg(name: string, defaultValue?: string) {
    let line = `ARG ${name}`;
    if (defaultValue !== undefined) {
      line += `=${defaultValue}`;
    }
    this.lines.push(line);
    return this;
  }

  copy(
    src: string,
    dest: string,
    options?: { from?: string | DockerfileStage; chown?: string; chmod?: string; link?: boolean },
  ) {
    let line = `COPY`;

    if (options?.from) {
      const from = typeof options.from === 'string' ? options.from : options.from.name;
      if (!from) {
        throw new Error('Invalid from option');
      }

      line += ` --from=${from}`;
    }

    if (options?.chown) {
      line += ` --chown=${options.chown}`;
    }

    if (options?.chmod) {
      line += ` --chmod=${options.chmod}`;
    }

    if (options?.link) {
      line += ` --link`;
    }

    line += ` ${src} ${dest}`;
    this.lines.push(line);
    return this;
  }

  add(src: string, dest: string, options?: string) {
    let line = `ADD ${src} ${dest}`;
    if (options) {
      line += ` ${options}`;
    }
    this.lines.push(line);
    return this;
  }

  run(command: string) {
    this.lines.push(`RUN ${command}`);
    return this;
  }

  env(key: string, value: string): this;
  env(envs: Record<string, string>): this;
  env(keyOrEnvs: string | Record<string, string>, value?: string) {
    if (typeof keyOrEnvs === 'string') {
      if (value === undefined) {
        throw new Error('Invalid env argument');
      }

      this.lines.push(`ENV ${keyOrEnvs}=${value}`);
    } else if (typeof keyOrEnvs === 'object' && keyOrEnvs !== null) {
      for (const [key, val] of Object.entries(keyOrEnvs)) {
        this.env(key, val);
      }
    }

    return this;
  }

  cmd(command: string) {
    // Using JSON array format for better practice
    this.lines.push(`CMD ["sh", "-c", "${command}"]`);
    return this;
  }

  entrypoint(command: string) {
    // Using JSON array format for better practice
    this.lines.push(`ENTRYPOINT ["${command}"]`);
    return this;
  }

  expose(port: number | string) {
    this.lines.push(`EXPOSE ${port}`);
    return this;
  }

  label(key: string, value: string) {
    this.lines.push(`LABEL ${key}=${value}`);
    return this;
  }

  volume(volume: string) {
    this.lines.push(`VOLUME ["${volume}"]`);
    return this;
  }

  user(user: string) {
    this.lines.push(`USER ${user}`);
    return this;
  }

  onbuild(instruction: string) {
    this.lines.push(`ONBUILD ${instruction}`);
    return this;
  }

  healthcheck(
    test: string,
    options?: { interval?: string; timeout?: string; retries?: number; startPeriod?: string },
  ) {
    let line = `HEALTHCHECK`;
    const opts: string[] = [];

    if (options?.interval) opts.push(`--interval=${options.interval}`);
    if (options?.timeout) opts.push(`--timeout=${options.timeout}`);
    if (options?.retries !== undefined) opts.push(`--retries=${options.retries}`);
    if (options?.startPeriod) opts.push(`--start-period=${options.startPeriod}`);

    if (opts.length > 0) {
      line += ` ${opts.join(' ')}`;
    }

    // Using JSON array format for test command
    line += ` CMD ${test}`;

    this.lines.push(line);
    return this;
  }

  shell(shell: string[]) {
    const shellString = shell.map((s) => `"${s}"`).join(', ');
    this.lines.push(`SHELL [${shellString}]`);
    return this;
  }

  stopSignal(signal: string) {
    this.lines.push(`STOPSIGNAL ${signal}`);
    return this;
  }

  newline() {
    this.lines.push('');
    return this;
  }

  getLines() {
    return [...this.lines];
  }

  toString() {
    return this.getLines().join('\n');
  }

  if(condition: boolean, cb: (stage: DockerfileStagePart) => void) {
    if (condition) {
      cb(this);
    }

    return this;
  }

  dotEnv(name: string | Record<string, string> | undefined = 'DOT_ENV', path: string = '.env') {
    if (name === undefined) {
      return this;
    }

    if (typeof name === 'string') {
      this.arg(name);
      this.run(`echo "$${name}" > ${path}`);
    } else if (typeof name === 'object' && name !== null) {
      // build env string from object
      const envString = Object.entries(name)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
      this.run(`echo "${envString}" > ${path}`);
    } else {
      throw new Error('Invalid dotEnv argument');
    }

    return this;
  }

  forEach<TItem>(items: TItem[], cb: (item: TItem) => void) {
    items.forEach((item) => cb(item));
    return this;
  }
}
