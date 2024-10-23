import type Protocol from './Protocol';
import type PortObject from './PortObject';

/*
https://docs.docker.com/engine/network/#published-ports
-p 8080:80	Map port 8080 on the Docker host to TCP port 80 in the container.
-p 192.168.1.100:8080:80	Map port 8080 on the Docker host IP 192.168.1.100 to TCP port 80 in the container.
-p 8080:80/udp	Map port 8080 on the Docker host to UDP port 80 in the container.
-p 8080:80/tcp -p 8080:80/udp	Map TCP port 8080 on the Docker host to TCP port 80 in the container, and map UDP port 8080 on the Docker host to UDP port 80 in the container.
*/

type ContainerPort = number;
type HostPort = number;
type Ip = string;

type PortMap = `${ContainerPort}:${HostPort}`;

type PortMapWithProtocol = `${PortMap}` | `${PortMap}/${Protocol}`;
type PortMapWithProtocolAndIp = `${PortMapWithProtocol}` | `${Ip}:${PortMapWithProtocol}`;

type Port = PortMapWithProtocolAndIp | PortObject;

export default Port;
