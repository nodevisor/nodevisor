type BaseArgumentValue = string | number | boolean | undefined | null;

type ArgumentValue = BaseArgumentValue | ArgumentValue[] | Record<string, BaseArgumentValue>;

export default ArgumentValue;
