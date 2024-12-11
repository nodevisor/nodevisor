import type DockerComposeServiceConfig from './DockerComposeServiceConfig';
import type DockerVolumeTopLevel from './DockerVolumeTopLevel';
import type DockerNetworkTopLevel from './DockerNetworkTopLevel';

type DockerComposeConfig = {
  version?: string;
  name?: string;
  services: Record<string, DockerComposeServiceConfig>;
  volumes?: Record<string, DockerVolumeTopLevel>;
  networks?: Record<string, DockerNetworkTopLevel>;
};

export default DockerComposeConfig;
