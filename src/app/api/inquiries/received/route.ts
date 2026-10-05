import { z } from "zod";
import { ApiError, handler, ok, parseQuery } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const querySchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "CLOSED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// The inquiries a tutor has received about their own profile.
export const GET = handler(async (req) => {
  const user = await requireUser(req, { roles: ["TUTOR"] });
  const p = parseQuery(req, querySchema);

  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!tutorProfile) throw new ApiError(404, "NOT_FOUND", "You have not created a tutor profile yet");

  const where = { tutorProfileId: tutorProfile.id, ...(p.status && { status: p.status }) };

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
        fromUser: { select: { name: true, phone: true, email: true } },
      },
    }),
  ]);

  return ok({ data, page: p.page, limit: p.limit, total });
});
