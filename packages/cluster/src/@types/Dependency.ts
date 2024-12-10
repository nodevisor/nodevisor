import ClusterBase from '../ClusterBase';
import type ClusterService from '../ClusterService';

type Dependency = {
  service: ClusterService;
  cluster: ClusterBase;
};

export default Dependency;
