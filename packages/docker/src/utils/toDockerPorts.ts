import { ClusterType, type Port, type PortObject } from '@nodevisor/cluster';
import parsePort from './parsePort';
import omitUndefined from './omitUndefined';

const defaultIp = '127.0.0.1';
const defaultProtocol = 'tcp';

export default function toDockerPorts(ports: Port[] = [], type: ClusterType): PortObject[] {
  return ports.map((port) => {
    const portConfig: PortObject = typeof port === 'string' ? parsePort(port) : port;

    const {
      target,
      published,
      mode,
      ip = mode === 'host' ? undefined : defaultIp,
      protocol = defaultProtocol,
    } = portConfig;

    if (mode !== 'host' && (!ip || ip === '0.0.0.0')) {
      throw new Error(
        'Any port mapping to 0.0.0.0 is not allowed by default because it exposes the port to the public internet. It will override firewall rules. More details: https://docs.docker.com/engine/network/#published-ports',
      );
    }

    if (type === ClusterType.DOCKER_SWARM) {
      return omitUndefined({
        target,
        published,
        protocol,
        mode,
      });
    }

    // https://docs.docker.com/reference/compose-file/services/#long-syntax-3
    return omitUndefined({
      target,
      published,
      host_ip: ip,
      protocol,
      mode,
    });
  });
}
