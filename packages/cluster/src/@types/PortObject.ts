import { type Protocol } from '@nodevisor/endpoint';

type PortObject = {
  target: number; // the port inside the container
  published: number; // the publicly exposed port
  ip?: string; // default 127.0.0.1
  protocol?: Protocol | 'tcp' | 'udp'; // default tcp
  mode?: 'host' | 'ingress'; // host for publishing a host port on each node, or ingress for a swarm mode port to be load balanced.
};

export default PortObject;
