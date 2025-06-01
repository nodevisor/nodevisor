import { z } from 'zod';

const runnerSchema = z.object({
  username: z.string().min(1, 'Runner username is required').optional().default('runner'),
  publicKeyPath: z
    .string()
    .min(1, 'Runner public key path is required')
    .optional()
    .default('~/.ssh/nodevisor_id_ed25519.pub'),
  privateKeyPath: z.string().optional().default('~/.ssh/nodevisor_id_ed25519'),
  passphrase: z.string().optional(),
});

export default runnerSchema;
