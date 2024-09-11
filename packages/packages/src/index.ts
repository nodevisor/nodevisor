import nodevisor from '@nodevisor/core';
import Packages from './Packages';

const packages = new Packages(nodevisor);

export default packages;
export { Packages };
