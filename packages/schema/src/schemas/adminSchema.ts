import { z } from 'zod';

const adminSchema = z.object({
  username: z.string().min(1, 'Admin username is required'),
  password: z.string().min(1, 'Admin password is required'),
  publicKeyPath: z.string().min(1, 'Admin public key path is required'),
  privateKeyPath: z.string().optional(),
  passphrase: z.string().optional(),
});

export default adminSchema;
