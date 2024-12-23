import { type Port, type PortObject } from '@nodevisor/cluster';

export default function parsePort(port: string): PortObject {
  // extract optional protocol
  const [portsPart, protocol] = port.split('/');
  if (!portsPart) {
    throw new Error('Invalid port format');
  }

  if (protocol && !['tcp', 'udp'].includes(protocol)) {
    throw new Error('Invalid protocol');
  }

  // add default ip 127.0.0.1 and protocol tcp
  const parts = portsPart.split(':');
  if (parts.length <= 1 || parts.length > 3) {
    throw new Error('Invalid port format');
  }

  if (parts.length === 2) {
    const [published, target] = parts;

    if (!published || !target) {
      throw new Error('Invalid port format');
    }

    const result: Port = {
      target: parseInt(target, 10),
      published: parseInt(published, 10),
    };

    if (protocol) {
      result.protocol = protocol as 'tcp' | 'udp';
    }

    return result;
  }

  const [ip, published, target] = parts;

  if (!published || !target) {
    throw new Error('Invalid port format');
  }

  const result: Port = {
    target: parseInt(target, 10),
    published: parseInt(published, 10),
    ip,
  };

  if (protocol) {
    result.protocol = protocol as 'tcp' | 'udp';
  }

  return result;
}
