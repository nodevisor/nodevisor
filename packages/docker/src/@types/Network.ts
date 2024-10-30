// https://docs.docker.com/reference/compose-file/services/#networks
type Network = {
  aliases?: string[];
  ipv4_address?: string;
  ipv6_address?: string;
  priority?: number; // default 0
  link_local_ips?: string[];
};

export default Network;
