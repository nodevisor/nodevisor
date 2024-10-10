import { Service } from '@nodevisor/core';
import Services from '@nodevisor/services';
import Packages from '@nodevisor/packages';

export default class SSH extends Service {
  readonly name = 'ssh';

  readonly services = new Services(this.nodevisor);
  readonly packages = new Packages(this.nodevisor);

  async installPackage() {
    await this.packages.install('openssh-server');
  }

  async uninstallPackage() {
    await this.packages.uninstall('openssh-server');
  }

  async isInstalled() {
    return await this.packages.isInstalled('openssh-server');
  }

  async getVersion() {
    return await this.$`ssh -V`.text();
  }

  async start() {
    await this.services.start('ssh');
  }

  async stop() {
    await this.services.stop('ssh');
  }

  async isRunning() {
    return await this.services.isRunning('ssh');
  }

  async restart() {
    await this.services.restart('ssh');
  }

  async disablePasswordAuthentication(skipRestart = false) {
    await this
      .$`sed -i 's/^#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config`;
    await this
      .$`sed -i 's/^PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config`;

    if (!skipRestart) {
      await this.restart();
    }
  }

  async enablePasswordAuthentication(skipRestart = false) {
    await this
      .$`sed -i 's/^#PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config`;
    await this
      .$`sed -i 's/^PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config`;

    if (!skipRestart) {
      await this.restart();
    }
  }
}
