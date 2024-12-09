import type Dependency from '../@types/Dependency';

function getDependencyId(dependency: Dependency) {
  return `${dependency.cluster.name}:${dependency.service.name}`;
}

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
