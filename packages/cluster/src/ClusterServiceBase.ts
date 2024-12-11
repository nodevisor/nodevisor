export type ClusterServiceBaseConfig = {
  name: string;
};

export default class ClusterServiceBase {
  readonly name: string;

  constructor(config: ClusterServiceBaseConfig) {
    const { name } = config;

    this.name = name;
  }
}
