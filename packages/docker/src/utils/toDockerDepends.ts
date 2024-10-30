import Depends from '../@types/Depends';

type DockerDepend = Omit<Depends, 'service'>;
type DockerDepends = Record<string, DockerDepend>;

export default function toDockerDepends(depends: Depends[] = []): DockerDepends {
  const result: DockerDepends = {};

  depends.forEach((depend) => {
    const { service, ...rest } = depend;

    result[service.name] = rest;
  });

  return result;
}
