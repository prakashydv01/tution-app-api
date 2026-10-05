import { z } from "zod";
import { handler, ok, parseQuery } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// The inquiries the signed-in user has sent, so they can track what they've reached out about.
export const GET = handler(async (req) => {
  const user = await requireUser(req);
  const p = parseQuery(req, querySchema);
  const where = { fromUserId: user.id };

  const [total, data] = await prisma.$transaction([
    prisma.inquiry.count({ where }),
    prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (p.page - 1) * p.limit,
      take: p.limit,
      select: {
        id: true,
        message: true,
        status: true,
        createdAt: true,
        tutorProfile: {
          select: {
            id: true,
            headline: true,
            user: { select: { name: true } },
            city: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  return ok({ data, page: p.page, limit: p.limit, total });
});
