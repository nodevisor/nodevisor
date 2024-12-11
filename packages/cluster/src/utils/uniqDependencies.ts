import type Dependency from '../@types/Dependency';
import getDependencyId from './getDependencyId';

export default function uniqDependencies(dependencies: Dependency[]) {
  const ids = new Set();

  return dependencies.filter((dependency) => {
    const id = getDependencyId(dependency);
    if (ids.has(id)) {
      return false;
    }

    ids.add(id);
    return true;
  });
}
