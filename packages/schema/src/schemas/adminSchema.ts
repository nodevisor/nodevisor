import { z } from 'zod';

const adminSchema = z.object({
  username: z.string().optional().default('root'),
  password: z.string().optional(),
  publicKeyPath: z.string().optional().default('~/.ssh/nodevisor_id_ed25519.pub'),
  privateKeyPath: z.string().optional().default('~/.ssh/nodevisor_id_ed25519'),
  passphrase: z.string().optional(),
});

export default adminSchema;
