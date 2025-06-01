import { z } from 'zod';

const adminSchema = z.object({
  username: z.string().min(1, 'Admin username is required').optional().default('root'),
  password: z.string().min(1, 'Admin password is required'),
  publicKeyPath: z
    .string()
    .min(1, 'Admin public key path is required')
    .optional()
    .default('~/.ssh/nodevisor_id_ed25519.pub'),
  privateKeyPath: z.string().optional().default('~/.ssh/nodevisor_id_ed25519'),
  passphrase: z.string().optional(),
});

export default adminSchema;
