import DockerfileStagePart from './DockerfileStagePart';

export default class DockerfileStage {
  readonly name: string;

  private parts: DockerfileStagePart[] = [];

  constructor(name: string, from: string | DockerfileStage) {
    this.name = name;

    const image = typeof from === 'string' ? from : from.name;

    this.add('init').from(image, name);
  }

  add(name: string) {
    const part = new DockerfileStagePart(name);

    if (this.parts.some((p) => p.name === name)) {
      throw new Error(`Stage part ${name} already exists`);
    }

    this.parts.push(part);
    return part;
  }

  getPart(name: string) {
    const part = this.parts.find((p) => p.name === name);
    if (!part) {
      throw new Error(`Part ${name} not found`);
    }

    return part;
  }

  getLines() {
    const lines: string[] = [];

    this.parts.forEach((part) => {
      lines.push(...part.getLines());
    });

    return lines;
  }

  toString() {
    return this.getLines().join('\n');
  }
}
