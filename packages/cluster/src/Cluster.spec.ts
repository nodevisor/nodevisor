import { User } from '@nodevisor/core';
import ClusterService from './ClusterService';
import ClusterNode from './ClusterNode';
import Cluster from './Cluster';
import type Dependency from './@types/Dependency';

class TestClusterNode extends ClusterNode {
  deploy(name: string, runner: User, manager: ClusterNode, options?: {}): Promise<void> {
    return Promise.resolve();
  }

  run(
    service: ClusterService,
    name: string,
    runner: User,
    manager: ClusterNode,
    options?: {},
  ): Promise<void> {
    return Promise.resolve();
  }
}

// Mock implementations
class TestClusterService extends ClusterService {}

class TestCluster extends Cluster<TestClusterService, TestClusterNode> {
  protected createClusterNode(config: any): TestClusterNode {
    return new TestClusterNode(config);
  }
}

describe('Cluster', () => {
  let cluster: TestCluster;
  let internalService: TestClusterService;
  let externalService: TestClusterService;
  let externalCluster: TestCluster;

  beforeEach(() => {
    // Setup test instances
    cluster = new TestCluster({ name: 'test-cluster' });
    internalService = new TestClusterService({ name: 'internal-service' });

    externalCluster = new TestCluster({ name: 'external-cluster' });
    externalService = new TestClusterService({ name: 'external-service' });
  });

  describe('getDependencies', () => {
    it('should return empty array when no dependencies are added', () => {
      const dependencies = cluster.getDependencies();
      expect(dependencies).toEqual([]);
    });

    it('should return internal dependencies by default', () => {
      cluster.addDependency(internalService);
      const dependencies = cluster.getDependencies();

      expect(dependencies).toHaveLength(1);
      expect(dependencies[0]?.service).toBe(internalService);
      expect(dependencies[0]?.cluster).toBe(cluster);
    });

    it('should exclude external dependencies by default', () => {
      // Add both internal and external dependencies
      cluster.addDependency(internalService);
      cluster.addDependency({
        service: externalService,
        cluster: externalCluster,
      });

      const dependencies = cluster.getDependencies();

      expect(dependencies).toHaveLength(1);
      expect(dependencies[0]?.service).toBe(internalService);
    });

    it('should include external dependencies when includeExternal is true', () => {
      // Add both internal and external dependencies
      cluster.addDependency(internalService);
      cluster.addDependency({
        service: externalService,
        cluster: externalCluster,
      });

      const dependencies = cluster.getDependencies(true);

      expect(dependencies).toHaveLength(2);
      expect(dependencies.map((d) => d.service)).toContain(internalService);
      expect(dependencies.map((d) => d.service)).toContain(externalService);
    });

    it('should handle nested dependencies when includeDepends is true', () => {
      // Create a service with dependencies
      const nestedService = new TestClusterService({ name: 'nested-service' });

      cluster.addDependency(internalService);

      internalService.addDependency(nestedService);

      const dependencies = cluster.getDependencies(false, true);

      expect(dependencies).toHaveLength(2);
      expect(dependencies.map((d) => d.service)).toContain(internalService);
      expect(dependencies.map((d) => d.service)).toContain(nestedService);
    });

    it('should not process external dependencies when includeDepends is true', () => {
      // Create services with dependencies
      const nestedService = new TestClusterService({ name: 'nested-service' });

      cluster.addDependency({
        service: externalService,
        cluster: externalCluster,
      });

      externalService.addDependency(nestedService);

      const dependencies = cluster.getDependencies(true, true);

      expect(dependencies).toHaveLength(1);
      expect(dependencies[0]?.service).toBe(externalService);
    });

    it('should process external dependencies when includeExternal is true and includeDepends is false', () => {
      // Create services with dependencies
      const nestedService = new TestClusterService({ name: 'nested-service' });
      const nestedExternalService = new TestClusterService({ name: 'nested-external-service' });

      externalService.addDependency(nestedExternalService);

      cluster.addDependency(internalService);

      cluster.addDependency({
        service: externalService,
        cluster: externalCluster,
      });

      internalService.addDependency(nestedService);

      const dependencies = cluster.getDependencies(true, true);

      expect(dependencies).toHaveLength(3);
      expect(dependencies[0]?.service).toBe(internalService);
      expect(dependencies[1]?.service).toBe(nestedService);
      expect(dependencies[2]?.service).toBe(externalService);

      expect(dependencies[0]?.cluster).toBe(cluster);
      expect(dependencies[1]?.cluster).toBe(cluster);
      expect(dependencies[2]?.cluster).toBe(externalCluster);
    });

    it('should return unique dependencies', () => {
      // Add the same service twice
      cluster.addDependency(internalService);
      cluster.addDependency(internalService);

      const dependencies = cluster.getDependencies();

      expect(dependencies).toHaveLength(1);
      expect(dependencies[0]?.service).toBe(internalService);
    });

    it('should handle complex dependency tree', () => {
      const service1 = new TestClusterService({ name: 'service1' });
      const service2 = new TestClusterService({ name: 'service2' });
      const service3 = new TestClusterService({ name: 'service3' });

      service1.addDependency(service2);
      service2.addDependency(service3);

      cluster.addDependency(service1);

      const dependencies = cluster.getDependencies(false, true);

      expect(dependencies).toHaveLength(3);
      expect(dependencies.map((d) => d.service)).toContain(service1);
      expect(dependencies.map((d) => d.service)).toContain(service2);
      expect(dependencies.map((d) => d.service)).toContain(service3);
    });
  });
});
