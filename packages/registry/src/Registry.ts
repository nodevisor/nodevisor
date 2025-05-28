import { type NodevisorProxy } from '@nodevisor/core';

export type RegistryConfig = {};

export default abstract class Registry {
  constructor(config: RegistryConfig) {}

  abstract push(image: string, options: { tags?: string[] }): Promise<void>;

  abstract login($con: NodevisorProxy): Promise<void>;

  abstract getLoginCredentials(): Promise<{
    username: string;
    password: string;
    server: string;
  }>;

  static getTag(image: string, defaultTag?: string) {
    return image.split(':')[1] ?? defaultTag;
  }

  static hasTag(image: string) {
    return image.includes(':');
  }

  static getImage(image: string) {
    return image.split(':')[0] ?? image;
  }

  static getImageWithTag(image: string, defaultTag?: string) {
    return `${this.getImage(image)}:${this.getTag(image, defaultTag)}`;
  }
}
