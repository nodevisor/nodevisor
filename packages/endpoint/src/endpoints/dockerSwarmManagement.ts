import type Endpoint from '../@types/Endpoint';
import Protocol from '../constants/Protocol';

const dockerSwarmManagement: Endpoint = {
  name: 'dockerSwarmManagement',
  port: 2377,
  protocol: Protocol.TCP,
};

export default dockerSwarmManagement;
