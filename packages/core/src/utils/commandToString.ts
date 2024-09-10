import type Quote from '../@types/Quote';
import type Command from '../@types/Command';
import quoteTemplateString from "./quoteTemplateString";

export default function commandToString(command: Command, quote: Quote): string {
  return command.map((part) => {
    const { strings, values } = part;
    return quoteTemplateString(strings, values, quote);
  }).join('');
}