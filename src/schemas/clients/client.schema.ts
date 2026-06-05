import { z } from 'zod';

export const ClientTagSchema = z.string().trim().min(1).max(24);

export const ClientSchema = z.object({
  id: z.string().min(1),
  salonId: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(20),
  email: z.string().email().nullable(),
  birthDate: z.date().nullable(),
  notes: z.string().max(2000),
  tags: z.array(ClientTagSchema).max(20),
  createdAt: z.date().nullable(),
  lastVisit: z.date().nullable(),
});

export const UpsertClientSchema = z.object({
  salonId: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(20),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.string().email().or(z.literal('')))
    .transform((value) => (value ? value : null)),
  birthDate: z.date().nullable(),
  notes: z.string().max(2000).default(''),
  tags: z.array(ClientTagSchema).max(20).default([]),
  lastVisit: z.date().nullable().default(null),
});

export type Client = z.infer<typeof ClientSchema>;
export type UpsertClientInput = z.infer<typeof UpsertClientSchema>;
