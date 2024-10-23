type SSH = {
  username: string;
  password?: string;
  port?: number;
  forceIPv4?: boolean;
  forceIPv6?: boolean;
  agent?: string;
  readyTimeout?: number;
} & (
  | {
      privateKey: string;
      passphrase?: string;
    }
  | {
      privateKeyPath: string;
      passphrase?: string;
    }
) &
  (
    | {
        publicKey?: string;
      }
    | {
        publicKeyPath?: string;
      }
  );

export default SSH;
