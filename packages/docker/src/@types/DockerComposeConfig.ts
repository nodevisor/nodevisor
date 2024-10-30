import type DockerComposeServiceConfig from './DockerComposeServiceConfig';
import type VolumeTopLevel from './VolumeTopLevel';
import type NetworkTopLevel from './NetworkTopLevel';

type DockerComposeConfig = {
  version?: string;
  name?: string;
  services: Record<string, DockerComposeServiceConfig>;
  volumes?: Record<string, VolumeTopLevel>;
  networks?: Record<string, NetworkTopLevel>;
};

export default DockerComposeConfig;
