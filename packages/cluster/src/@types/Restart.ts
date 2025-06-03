import type Duration from './Duration';

type RestartCondition = 'none' | 'on-failure' | 'any'; // default 'any'

type Restart =
  | RestartCondition
  | {
      condition?: RestartCondition; // default 'any'
      delay?: Duration; // default is 0, meaning restart attempts can occur immediately.
      maxAttempts?: number; // default: never give up
      window?: Duration; // default: decide immediately
    };

export default Restart;
