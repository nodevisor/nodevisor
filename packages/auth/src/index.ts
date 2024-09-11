import nodevisor from '@nodevisor/core';
import Auth from './Auth';

const auth = new Auth(nodevisor);

export default auth;
export { Auth };
