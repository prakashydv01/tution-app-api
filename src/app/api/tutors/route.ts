import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { handler, ok, parseQuery } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { tutorListSelect } from "@/lib/tutor-select";

const id = z.coerce.number().int().positive();

const querySchema = z.object({
  cityId: id.optional(),
  localityId: id.optional(),
  subjectId: id.optional(),
  levelId: id.optional(),
  teachingMode: z.enum(["HOME", "CENTER", "ONLINE"]).optional(),
  maxFee: z.coerce.number().int().positive().optional(),
  q: z.string().trim().min(1).max(80).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// Public search: only admin-verified, active tutors. Contact details are not included.
export const GET = handler(async (req) => {
  const p = parseQuery(req, querySchema);

  const where: Prisma.TutorProfileWhereInput = {
    isVerified: true,
    isActive: true,
    ...(p.cityId && { cityId: p.cityId }),
    ...(p.localityId && { localityId: p.localityId }),
    ...(p.subjectId && { subjects: { some: { id: p.subjectId } } }),
    ...(p.levelId && { levels: { some: { id: p.levelId } } }),
    ...(p.teachingMode && { modes: { has: p.teachingMode } }),
    ...(p.maxFee && { feeMin: { lte: p.maxFee } }),
    ...(p.q && {
      OR: [
        { headline: { contains: p.q, mode: "insensitive" } },
        { user: { name: { contains: p.q, mode: "insensitive" } } },
      ],
    }),
  };

  const [total, data] = await prisma.$transaction([
    prisma.tutorProfile.count({ where }),
    prisma.tutorProfile.findMany({
      where,
      select: tutorListSelect,
      orderBy: [{ experienceYears: "desc" }, { updatedAt: "desc" }],
      skip: (p.page - 1) * p.limit,
      take: p.limit,
    }),
  ]);

  return ok({ data, page: p.page, limit: p.limit, total, totalPages: Math.ceil(total / p.limit) });
});
