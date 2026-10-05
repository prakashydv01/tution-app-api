import { z } from "zod";
import { handler, ok, parseQuery } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { tutorDetailSelect } from "@/lib/tutor-select";

const querySchema = z.object({
  status: z.enum(["pending", "verified"]).default("pending"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const GET = handler(async (req) => {
  await requireUser(req, { roles: ["ADMIN"] });
  const p = parseQuery(req, querySchema);
  const where = { isVerified: p.status === "verified" };

  const [total, data] = await prisma.$transaction([
    prisma.tutorProfile.count({ where }),
    prisma.tutorProfile.findMany({
      where,
      select: { ...tutorDetailSelect, user: { select: { name: true, email: true, phone: true } } },
      orderBy: { createdAt: "asc" },
      skip: (p.page - 1) * p.limit,
      take: p.limit,
    }),
  ]);

  return ok({ data, page: p.page, limit: p.limit, total });
});
