import { z } from 'zod';

const runnerSchema = z.object({
  username: z.string().min(1, 'Runner username is required'),
  publicKeyPath: z.string().min(1, 'Runner public key path is required'),
  privateKeyPath: z.string().optional(),
  passphrase: z.string().optional(),
});

export default runnerSchema;
