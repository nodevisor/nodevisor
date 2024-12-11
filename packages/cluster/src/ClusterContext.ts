import createContext, { useContext } from 'contexta';
import type ClusterBase from './ClusterBase';
import ClusterType from './constants/ClusterType';

const ClusterContext = createContext<{
  cluster?: ClusterBase;
  type?: ClusterType;
}>({});

export const useCluster = () => useContext(ClusterContext);

export default ClusterContext;
