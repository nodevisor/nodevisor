import { ClusterType, type Port, type PortObject } from '@nodevisor/cluster';
import parsePort from './parsePort';
import omitUndefined from './omitUndefined';

const defaultProtocol = 'tcp';

export default function toDockerPorts(ports: Port[] = [], type: ClusterType): PortObject[] {
  return ports.map((port) => {
    const portConfig: PortObject = typeof port === 'string' ? parsePort(port) : port;

    const { target, published, mode, ip, protocol = defaultProtocol } = portConfig;

    if (!ip) {
      throw new Error(
        'By default, all ports are mapped to 0.0.0.0 and publicly accessable. Therefore, you must specify the ip address of the port explicitly. More details: https://docs.docker.com/engine/network/#published-ports',
      );
    }

    if (type === ClusterType.DOCKER_SWARM) {
      if (ip !== '0.0.0.0') {
        throw new Error(
          'In Swarm mode, is docker ignoring the ip address and all ports are mapped to 0.0.0.0 and publicly accessable. If you want to publicly expose a port, you must explicitly set the ip address to 0.0.0.0. If you need private access, use our VPN nodevisor service.More details: https://docs.docker.com/engine/network/#published-ports',
        );
      }

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
