import nodevisor from '@nodevisor/core';
import FS from './FS';

const fs = new FS(nodevisor);

export default fs;
export { FS };
