import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { ApiError, created, handler, ok, parseBody, parseQuery } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireUser, getUserFromRequest } from "@/lib/auth";

const positiveId = z.number().int().positive();

const bodySchema = z
  .object({
    localityId: positiveId,
    subjectId: positiveId,
    levelId: positiveId,
    budgetMin: z.number().int().min(0).max(10_000_000).optional(),
    budgetMax: z.number().int().min(0).max(10_000_000).optional(),
    description: z.string().trim().max(1000).optional(),
  })
  .refine((d) => d.budgetMin == null || d.budgetMax == null || d.budgetMin <= d.budgetMax, {
    message: "budgetMin cannot be greater than budgetMax",
    path: ["budgetMin"],
  });

// A seeker posts what they're looking for — e.g. "Grade 10 math tutor in Baneshwor".
export const POST = handler(async (req) => {
  const user = await requireUser(req);
  const { localityId, subjectId, levelId, ...rest } = await parseBody(req, bodySchema);

  const [locality, subject, level] = await Promise.all([
    prisma.locality.findUnique({ where: { id: localityId } }),
    prisma.subject.findUnique({ where: { id: subjectId } }),
    prisma.level.findUnique({ where: { id: levelId } }),
  ]);
  if (!locality) throw new ApiError(400, "INVALID_LOCALITY", "Locality does not exist");
  if (!subject) throw new ApiError(400, "INVALID_SUBJECT", "Subject does not exist");
  if (!level) throw new ApiError(400, "INVALID_LEVEL", "Level does not exist");

  const requirement = await prisma.requirement.create({
    data: { ...rest, userId: user.id, localityId, subjectId, levelId },
    select: { id: true, description: true, budgetMin: true, budgetMax: true, isActive: true, createdAt: true },
  });

  return created({ data: requirement });
});

const querySchema = z.object({
  cityId: positiveId.optional(),
  subjectId: positiveId.optional(),
  levelId: positiveId.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const listSelect = {
  id: true,
  description: true,
  budgetMin: true,
  budgetMax: true,
  createdAt: true,
  locality: { select: { id: true, name: true, city: { select: { id: true, name: true } } } },
  subject: { select: { id: true, name: true } },
  level: { select: { id: true, name: true } },
  user: { select: { name: true, phone: true, email: true } },
} satisfies Prisma.RequirementSelect;

// Public: tutors browse open requirement postings. Contact details are only included
// for signed-in, email-verified tutors, same spirit as how a tutor's own phone is hidden
// from anonymous visitors — this is the reverse direction of that same privacy rule.
export const GET = handler(async (req) => {
  const p = parseQuery(req, querySchema);

  const where: Prisma.RequirementWhereInput = {
    isActive: true,
    ...(p.subjectId && { subjectId: p.subjectId }),
    ...(p.levelId && { levelId: p.levelId }),
    ...(p.cityId && { locality: { cityId: p.cityId } }),
  };

  const [total, results] = await prisma.$transaction([
    prisma.requirement.count({ where }),
    prisma.requirement.findMany({
      where,
      select: listSelect,
      orderBy: { createdAt: "desc" },
      skip: (p.page - 1) * p.limit,
      take: p.limit,
    }),
  ]);

  const viewer = await getUserFromRequest(req);
  const contactVisible = viewer?.role === "TUTOR" && viewer.emailVerifiedAt != null;

  const data = results.map(({ user, ...r }) => ({
    ...r,
    user: contactVisible ? user : { name: user.name },
  }));

  return ok({ data, page: p.page, limit: p.limit, total, contactVisible });
});