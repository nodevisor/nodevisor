import { Module, pwshArgQuote } from '@nodevisor/core';

export default class PWSH extends Module {
  readonly name = 'pwsh';

  command(strings: TemplateStringsArray, ...values: any[]) {
    const command = this.$(strings, ...values)
      .setPowerShellQuote()
      .toString();

    return this.$`pwsh -Command ${command} -NonInteractive`.setQuote(pwshArgQuote);
  }
}
