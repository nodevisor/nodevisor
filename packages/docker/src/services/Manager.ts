import Nextjs, { type NextjsConfig } from './Nextjs';

type ManagerConfig = NextjsConfig & {};

export default class Manager extends Nextjs {
  constructor(config: ManagerConfig) {
    const { ...rest } = config;

    super({
      ...rest,
    });
  }
}
