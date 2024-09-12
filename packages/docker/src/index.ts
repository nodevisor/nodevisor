import nodevisor from '@nodevisor/core';
import Docker from './Docker';
import DockerSwarm from './DockerSwarm';

const docker = new Docker(nodevisor);
const dockerSwarm = new DockerSwarm(nodevisor);

export default docker;

export { Docker };
export { DockerSwarm, dockerSwarm };
