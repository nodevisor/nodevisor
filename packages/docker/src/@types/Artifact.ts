import { DockerfileStage } from '../dockerfiles';

type Artifact = {
  source: string;
  dest?: string;
  from?: DockerfileStage | string;
};

export default Artifact;
