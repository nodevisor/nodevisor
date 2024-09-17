import nodevisor from '@nodevisor/core';
import Packages from './Packages';

export * from './constants';

const packages = new Packages(nodevisor);

export default packages;
export { Packages };
