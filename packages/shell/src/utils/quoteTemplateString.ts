import type Quote from '../@types/Quote';

export default function quoteTemplateString(strings: string[], values: any[], quote: Quote) {
  return strings.reduce((acc, str, i) => {
    const variable = values[i] != null ? quote(values[i]) : '';
    return acc + str + variable;
  }, '');
}
