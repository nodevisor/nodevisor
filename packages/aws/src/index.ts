import nodevisor from '@nodevisor/core';
import AWS from './AWS';

const aws = new AWS(nodevisor);

export default aws;
export { AWS };
