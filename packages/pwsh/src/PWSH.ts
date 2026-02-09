import { Module, doubleQuote } from '@nodevisor/shell';

export default class PWSH extends Module {
  readonly name = 'pwsh';

  command(strings: TemplateStringsArray, ...values: any[]) {
    const command = this.$(strings, ...values)
      .setPowerShellQuote()
      .toString();

    return this.$`pwsh -Command ${command}`.setQuote(doubleQuote);
  }
}
