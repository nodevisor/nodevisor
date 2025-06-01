import { ClusterUser } from '@nodevisor/cluster';
import DockerNode from './DockerNode';

describe('DockerNode', () => {
  it('should be able to connect to a node', async () => {
    const node = new DockerNode({
      host: '38.242.201.62',
    });

    await node.connect(
      new ClusterUser({
        username: 'root',
      }),
    );
  });
});
