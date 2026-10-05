import type { Prisma } from "@/generated/prisma/client";

export const tutorListSelect = {
  id: true,
  headline: true,
  experienceYears: true,
  feeMin: true,
  feeMax: true,
  feeUnit: true,
  modes: true,
  isVerified: true,
  user: { select: { name: true } },
  city: { select: { id: true, name: true } },
  locality: { select: { id: true, name: true } },
  subjects: { select: { id: true, name: true } },
  levels: { select: { id: true, name: true } },
} satisfies Prisma.TutorProfileSelect;

export const tutorDetailSelect = {
  ...tutorListSelect,
  bio: true,
  contactPhone: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TutorProfileSelect;
