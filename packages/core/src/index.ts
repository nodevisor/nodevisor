import Nodevisor from './Nodevisor';

export * from './constants';
export * from './connections';
export * from './errors';
export * from './envs';
export * from './modules';

export { default as Nodevisor } from './Nodevisor';
export * from './Nodevisor';

export { default as Package } from './Package';
export * from './Package';

export { default as Service } from './Service';
export * from './Service';

export * from './utils';

const nodevisor = new Nodevisor();

export const $ = nodevisor.$;

export default nodevisor;
