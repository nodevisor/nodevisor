import Docker from './Docker';
import DockerSwarm from './DockerSwarm';

const dockerSwarm = new DockerSwarm();

export default new Docker();

export { Docker };
export { DockerSwarm, dockerSwarm };
