// https://docs.docker.com/reference/compose-file/networks/#driver
// https://docs.docker.com/engine/network/drivers/
type NetworkTopLevel = {
  driver?: 'overlay' | 'bridge'; // default: overlay for swarm, bridge is for standalone
  driver_opts?: Record<string, string>;
  // allow other services to join the network
  // The --attachable option enables both standalone containers and Swarm services to connect to the overlay network.
  // Without --attachable, only Swarm services can connect to the network.
  attachable?: boolean;
  external?: boolean;
  internal?: boolean;
  name?: string;
  labels?: string[];
  enable_ipv6?: boolean;
};

export default NetworkTopLevel;
