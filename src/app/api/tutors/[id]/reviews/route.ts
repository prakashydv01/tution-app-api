import { z } from "zod";
import { ApiError, created, handler, ok, parseBody, parseQuery } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// Public: reviews for one tutor, plus the average rating and count.
export const GET = handler(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const { id: tutorProfileId } = await ctx.params;
  const p = parseQuery(req, querySchema);
  const where = { tutorProfileId };

  const [total, summary, data] = await prisma.$transaction([
    prisma.review.count({ where }),
    prisma.review.aggregate({ where, _avg: { rating: true } }),
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (p.page - 1) * p.limit,
      take: p.limit,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        author: { select: { name: true } },
      },
    }),
  ]);

  return ok({
    data,
    page: p.page,
    limit: p.limit,
    total,
    averageRating: summary._avg.rating ? Math.round(summary._avg.rating * 10) / 10 : null,
  });
});

const bodySchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

// Create or update the signed-in user's own review of this tutor (one review per person, per tutor).
export const POST = handler(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(req);
  const { id: tutorProfileId } = await ctx.params;
  const { rating, comment } = await parseBody(req, bodySchema);

  const tutor = await prisma.tutorProfile.findFirst({
    where: { id: tutorProfileId, isVerified: true, isActive: true },
    select: { id: true, userId: true },
  });
  if (!tutor) throw new ApiError(404, "NOT_FOUND", "Tutor not found");
  if (tutor.userId === user.id) {
    throw new ApiError(400, "CANNOT_REVIEW_SELF", "You cannot review your own tutor profile");
  }

  const review = await prisma.review.upsert({
    where: { tutorProfileId_authorId: { tutorProfileId, authorId: user.id } },
    update: { rating, comment },
    create: { tutorProfileId, authorId: user.id, rating, comment },
    select: { id: true, rating: true, comment: true, createdAt: true },
  });

  return created({ data: review });
});
