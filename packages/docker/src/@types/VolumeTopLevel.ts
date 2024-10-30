// https://docs.docker.com/reference/compose-file/volumes/

type VolumeTopLevel = {
  driver: 'local';
  name?: string;
  labels?: Record<string, string>;
};

export default VolumeTopLevel;
