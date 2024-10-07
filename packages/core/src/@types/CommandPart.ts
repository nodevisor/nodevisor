type CommandPart = {
  readonly type: 'operator' | 'token';
  readonly strings: string[];
  readonly values: any[];
};

export default CommandPart;
