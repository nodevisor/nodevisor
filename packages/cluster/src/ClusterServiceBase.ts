export type ClusterServiceBaseConfig = {
  name: string;
  external?: boolean;
};

export default class ClusterServiceBase {
  readonly name: string;
  readonly external: boolean;

  constructor(config: ClusterServiceBaseConfig) {
    const { name, external = false } = config;

    this.name = name;
    this.external = external;
  }
}
