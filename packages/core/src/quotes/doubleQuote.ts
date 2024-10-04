import { type Quote, type QuoteArg } from '../@types';
import { Raw } from '../utils/raw';

const doubleQuote: Quote = (arg: QuoteArg | QuoteArg[]): string | Raw => {
  if (Array.isArray(arg)) {
    return arg.map((a) => doubleQuote(a)).join(' ');
  }

  if (arg instanceof Raw) {
    return arg;
  }

  // return `"${arg.replace(/"/g, '\\"')}"`;
  // Replace double quotes with backtick double quote and escape backticks
  return `"${arg.replace(/`/g, '``').replace(/"/g, '`"')}"`;
};

export default doubleQuote;
