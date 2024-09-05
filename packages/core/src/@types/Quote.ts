import type QuoteArg from './QuoteArg';
import { type Raw } from '../utils/raw';

type Quote = (arg: QuoteArg | QuoteArg[]) => string | Raw;

export default Quote;
