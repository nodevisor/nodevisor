// https://docs.docker.com/reference/compose-file/volumes/

type VolumeTopLevel = {
  driver: 'local';
  name?: string;
  labels?: Record<string, string>;
  external?: boolean;
};

export default VolumeTopLevel;
