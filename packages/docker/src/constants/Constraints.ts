enum Constraints {
  NODE_ROLE_MANAGER = 'node.role == manager',
  NODE_ROLE_WORKER = 'node.role != manager',
}

export default Constraints;
