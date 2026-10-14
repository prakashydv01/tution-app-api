import { z } from "zod";
import { handler, ok, parseQuery } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const GET = handler(async (req) => {
  const user = await requireUser(req, { verified: false });
  const p = parseQuery(req, querySchema);
  const where = { userId: user.id };

  const [total, data] = await prisma.$transaction([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (p.page - 1) * p.limit,
      take: p.limit,
      select: { id: true, type: true, title: true, body: true, data: true, isRead: true, createdAt: true },
    }),
  ]);

  return ok({ data, page: p.page, limit: p.limit, total, totalPages: Math.ceil(total / p.limit) });
});