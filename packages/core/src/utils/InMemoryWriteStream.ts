import { Writable } from 'node:stream';

export default class InMemoryWriteStream extends Writable {
  data: Buffer[];

  constructor(options = {}) {
    super(options);
    this.data = [];
  }

  _write(chunk: Buffer, encoding: BufferEncoding, callback: () => void) {
    this.data.push(chunk);
    callback();
  }

  getData() {
    return Buffer.concat(this.data);
  }
}
