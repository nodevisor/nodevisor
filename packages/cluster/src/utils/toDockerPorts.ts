import type Port from '../@types/Port';
import type PortObject from '../@types/PortObject';
import parsePort from './parsePort';

const defaultIp = '127.0.0.1';
const defaultProtocol = 'tcp';

export default function toDockerPorts(ports: Port[] = []): PortObject[] {
  return ports.map((port) => {
    const portConfig: Port = typeof port === 'string' ? parsePort(port) : port;

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

    return {
      target,
      published,
      ip,
      protocol,
      mode,
    };
  });
}
