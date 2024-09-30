import { type Quote, type QuoteArg } from '../@types';
import { Raw } from '../utils/raw';

const quoteSimple: Quote = (arg: QuoteArg | QuoteArg[]): string | Raw => {
  if (Array.isArray(arg)) {
    return arg.map((a) => quoteSimple(a)).join(' ');
  }

  if (arg instanceof Raw) {
    return arg;
  }

  return arg.replace(/"/g, '`"');
};

export default quoteSimple;
