import nodevisor from '@nodevisor/core';
import Users from './Users';

const users = new Users(nodevisor);

export default users;
export { Users };
