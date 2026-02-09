import type Quote from '../@types/Quote';
import type Command from '../@types/Command';
import quoteTemplateString from './quoteTemplateString';

export default function commandToString(command: Command, quote: Quote): string {
  return command
    .map((part, index) => {
      const { strings, values, type } = part;

      if (type === 'operator') {
        // ignore operators at the start and end of the command
        if (index === 0 || index === command.length - 1) {
          return '';
        }

        // add spaces around operators to improve readability
        return ` ${quoteTemplateString(strings, values, quote)} `;
      }

      return quoteTemplateString(strings, values, quote);
    })
    .join('');
}
