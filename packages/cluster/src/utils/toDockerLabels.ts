import type Labels from '../@types/Labels';

export default function toDockerLabels(labels: Labels = {}): Record<string, string> {
  const dockerLabels: Record<string, string> = {};

  Object.entries(labels).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    } else if (typeof value === 'string') {
      dockerLabels[key] = value;
    } else if (typeof value === 'boolean') {
      dockerLabels[key] = value ? 'true' : 'false';
    } else if (typeof value === 'number') {
      dockerLabels[key] = value.toString();
    }
  });

  return dockerLabels;
}
