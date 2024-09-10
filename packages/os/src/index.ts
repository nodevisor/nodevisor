export * from './constants';

import nodevisor from '@nodevisor/core';
import OS from './OS';

const os = new OS(nodevisor);

export default os;
export { OS };
