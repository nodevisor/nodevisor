// https://docs.docker.com/reference/compose-file/services/#volumes
type DockerVolume = {
  source?: string;
  target: string;
  read_only?: boolean;
} & (
  | {
      type: 'volume';
      volume?: {
        nocopy?: boolean;
        subpath?: string;
      };
    }
  | {
      type: 'bind';
      bind?: {
        propagation?: string;
        create_host_path?: boolean;
        selinux?: 'z' | 'Z';
      };
    }
  | {
      type: 'tmpfs';
      tmpfs: {
        size?: number;
        mode?: number;
      };
    }
  | {
      type: 'npipe';
    }
  | {
      type: 'cluster';
    }
);

export default DockerVolume;
