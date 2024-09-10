import type Quote from '../@types/Quote';

export default function quoteTemplateString(strings: TemplateStringsArray, values: any[], quote: Quote) {
  return strings.reduce((acc, str, i) => {
    const variable = values[i] ? quote(values[i]) : '';
    return acc + str + variable;
  }, '');
}
