// https://docs.docker.com/reference/compose-file/volumes/

type DockerVolumeTopLevel = {
  driver: 'local';
  name?: string;
  labels?: Record<string, string>;
  external?: boolean;
};

export default DockerVolumeTopLevel;
