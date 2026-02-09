export default class UnsupportedPlatformError extends Error {
  constructor() {
    super('Unsupported platform');
    this.name = 'UnsupportedPlatformError';
  }
}