import { type Quote, type QuoteArg } from "../@types";
import { Raw } from "../utils/raw";

const quote: Quote = (arg: QuoteArg | QuoteArg[]): string | Raw => {
  if (Array.isArray(arg)) {
    return arg.map((a) => quote(a)).join(' ');
  }

  if (arg instanceof Raw) {
    return arg;
  }

  if (/^[a-z0-9/_.\-@:=]+$/i.test(arg) || arg === '') {
    return arg;
  }

  return `$'${arg
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\f/g, '\\f')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\v/g, '\\v')
    .replace(/\0/g, '\\0')}'`;
};

export default quote;
