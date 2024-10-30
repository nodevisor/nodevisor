export default function toDockerStringObject(
  data: Record<string, boolean | number | string>,
): Record<string, string> {
  const result: Record<string, string> = {};

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }

    if (typeof value === 'boolean') {
      result[key] = value ? 'true' : 'false';
    } else {
      result[key] = value.toString();
    }
  });

  return result;
}
