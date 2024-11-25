import DockerfileStage from './DockerfileStage';

export default class Dockerfile {
  private stages: DockerfileStage[] = [];

  get length() {
    return this.stages.length;
  }

  get target() {
    const lastStage = this.stages[this.stages.length - 1];
    if (!lastStage) {
      throw new Error('No stages added to Dockerfile');
    }

    return lastStage.name;
  }

  has(name: string) {
    return this.stages.some((stage) => stage.name === name);
  }

  add(stage: DockerfileStage) {
    // check if stage is already in the array
    if (this.stages.some((s) => s.name === stage.name)) {
      throw new Error(`Stage ${stage.name} already exists`);
    }

    this.stages.push(stage);
    return this;
  }

  get(name: string) {
    return this.stages.find((stage) => stage.name === name);
  }

  clear() {
    this.stages = [];
    return this;
  }

  toString(): string {
    return this.stages.map((stage) => stage.getLines().join('\n')).join('\n\n');
  }
}