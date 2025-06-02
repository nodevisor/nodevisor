// https://docs.docker.com/reference/compose-file/volumes/

type DockerVolumeTopLevel = {
  driver: 'local';
  name?: string;
  labels?: Record<string, string>;
  external?: boolean;
  driver_opts?: Record<string, string>;
};

export default DockerVolumeTopLevel;
