import type Endpoint from '../@types/Endpoint';
import Protocol from '../constants/Protocol';

const ssh: Endpoint = {
  name: 'ssh',
  port: 22,
  protocol: Protocol.TCP,
};

export default ssh;
