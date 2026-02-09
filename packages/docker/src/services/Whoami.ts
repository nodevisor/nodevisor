import { PartialFor } from '@nodevisor/cluster';
import Web, { type WebConfig } from './Web';

export type WhoamiConfig = PartialFor<WebConfig, 'name'> & {};

export default class Whoami extends Web {
  constructor(config: WhoamiConfig) {
    const { name = 'whoami', image = 'traefik/whoami', port = 80, ...rest } = config;

    super({
      name,
      image,
      port,
      ...rest,
    });
  }
}
