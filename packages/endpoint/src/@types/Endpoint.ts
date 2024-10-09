import Protocol from '../constants/Protocol';

type Endpoint = {
  name?: string;
  port: number;
  protocol: Protocol;
};

export default Endpoint;
