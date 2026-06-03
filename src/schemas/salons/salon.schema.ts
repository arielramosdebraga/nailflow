import { z } from 'zod';

export const SalonSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  ownerId: z.string().nullable(),
  active: z.boolean(),
  timezone: z.string().min(1),
  currency: z.string().min(1),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
});

export type Salon = z.infer<typeof SalonSchema>;
