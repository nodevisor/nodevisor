import type Endpoint from '../@types/Endpoint';
import Protocol from '../constants/Protocol';

const web: Endpoint = {
  name: 'web',
  port: 80,
  protocol: Protocol.TCP,
};

export default web;
