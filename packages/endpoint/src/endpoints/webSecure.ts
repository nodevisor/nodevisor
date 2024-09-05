import type Endpoint from '../@types/Endpoint';
import Protocol from '../constants/Protocol';

const webSecure: Endpoint = {
  name: 'webSecure',
  port: 443,
  protocol: Protocol.TCP,
};

export default webSecure;
