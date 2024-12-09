import createContext, { useContext } from 'contexta';
import type ClusterBase from './ClusterBase';

const ClusterContext = createContext<ClusterBase | null>(null);

export const useCluster = () => useContext(ClusterContext);

export default ClusterContext;
