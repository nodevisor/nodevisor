import type Connection from '../connections/Connection';
import type RunAs from '../@types/RunAs';
import Env from '../envs/Env';

import Platform from '../constants/Platform';
import CommandBuilderBase, { type CommandBuilderBaseOptions } from './CommandBuilderBase';

const platforms = Object.values(Platform) as string[];

export type CommandBuilderOptions = CommandBuilderBaseOptions & {
  env?: Env;
  runAs?: RunAs;
};

export default class CommandBuilder extends CommandBuilderBase {
  private runAs?: RunAs;
  private env: Env;

  constructor(connection: Connection, options: CommandBuilderOptions = {}) {
    const { runAs, env, ...rest } = options;

    super(connection, rest);

    this.runAs = runAs;
    this.env = new Env(env);
  }

  setEnv(values: Record<string, string>) {
    this.env.set(values);
    return this;
  }

  async exec(): Promise<string> {
    if (this.getQuote()) {
      return super.exec();
    }

    const platform = await this.platform();
    switch (platform) {
      case Platform.WINDOWS:
        return this.clone().setPowerShellQuote().exec();
      default:
        return this.clone().setShellQuote().exec();
    }
  }

  private applyRunAs(cmd: string): string {
    const { runAs } = this;
    if (!runAs) {
      return cmd;
    }

    const { username, method = 'su' } = runAs;

    switch (method) {
      case 'su':
        return this.$`su - ${username} -c ${cmd}`.toString();
      case 'runuser':
        return this.$`runuser -l ${username} -c ${cmd}`.toString();
      default:
        throw new Error(`Unsupported user switch: ${method}`);
    }
  }

  toString() {
    const cloned = this.clone().clear();

    // add env variables
    const envVariables = this.env.toObject();
    Object.keys(envVariables).forEach((key) => {
      const value = envVariables[key];
      if (value === undefined) {
        return;
      }

      cloned.and`export ${key}=${value}`;
    });

    // add env files
    const envFiles = this.env.getFiles();
    if (envFiles.length) {
      cloned.and`set -a`;
      envFiles.forEach((file) => {
        cloned.and`source ${file}`;
      });
      cloned.and`set +a`;
    }

    cloned.merge(this);

    const cmd = super.toString.call(cloned);

    if (this.runAs) {
      return this.applyRunAs(cmd);
    }

    return cmd;
  }

  clone() {
    const clone = super.clone();
    clone.runAs = this.runAs;
    clone.env = new Env(this.env);
    return clone;
  }

  clear() {
    super.clear();
    this.runAs = undefined;
    this.env = new Env();
    return this;
  }

  async platform() {
    return this.cached('platform', async () => {
      try {
        const platform = await this.$`uname -s`.setShellQuote().toLowerCase();
        if (platforms.includes(platform)) {
          return platform as Platform;
        }

        if (platform.includes('mingw') || platform.includes('cygwin')) {
          return Platform.WINDOWS;
        }

        throw new Error('Unsupported platform');
      } catch (error) {
        const platform = await this
          .$`powershell -command "(Get-WmiObject Win32_OperatingSystem).Caption"`
          .setPowerShellQuote()
          .toLowerCase();

        if (platforms.includes(platform)) {
          return platform as Platform;
        }

        if (platform.includes('windows')) {
          return Platform.WINDOWS;
        }
      }

      throw new Error('Unsupported platform');
    });
  }
}
