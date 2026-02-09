import { type Quote, type QuoteArg } from "../@types";
import { Raw } from "../utils/raw";

const powerShellQuote: Quote = (arg: QuoteArg | QuoteArg[]): string | Raw =>{
  if (Array.isArray(arg)) {
    return arg.map((a) => powerShellQuote(a)).join(' ');
  }

  if (arg instanceof Raw) {
    return arg;
  }

  if (/^[a-z0-9/_.\-]+$/i.test(arg) || arg === '') {
    return arg;
  }
  return `'${arg.replace(/'/g, "''")}'`;
}

export default powerShellQuote;