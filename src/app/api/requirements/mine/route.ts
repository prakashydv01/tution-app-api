import { z } from "zod";
import { handler, ok, parseQuery } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// The requirements the signed-in user has posted — active and closed.
export const GET = handler(async (req) => {
  const user = await requireUser(req);
  const p = parseQuery(req, querySchema);
  const where = { userId: user.id };

  const [total, data] = await prisma.$transaction([
    prisma.requirement.count({ where }),
    prisma.requirement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (p.page - 1) * p.limit,
      take: p.limit,
      select: {
        id: true,
        description: true,
        budgetMin: true,
        budgetMax: true,
        isActive: true,
        createdAt: true,
        locality: { select: { id: true, name: true, city: { select: { id: true, name: true } } } },
        subject: { select: { id: true, name: true } },
        level: { select: { id: true, name: true } },
      },
    }),
  ]);

  return ok({ data, page: p.page, limit: p.limit, total });
});