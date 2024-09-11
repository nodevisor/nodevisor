import { Module, type Nodevisor, Platform } from '@nodevisor/core';

export default class Services extends Module {
  constructor(nodevisor: Nodevisor) {
    super(nodevisor, {
      name: 'services',
    });
  }

  async restart(name: string) {
    return this.$`systemctl restart ${name}`;
  }
}
