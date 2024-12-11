import type Dependency from '../@types/Dependency';

export default function getDependencyId(dependency: Dependency) {
  return `${dependency.cluster.name}:${dependency.service.name}`;
}
