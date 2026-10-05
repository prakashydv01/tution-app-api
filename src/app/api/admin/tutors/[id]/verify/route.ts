import { z } from "zod";
import { handler, ok, parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const bodySchema = z.object({ isVerified: z.boolean() });

export const PATCH = handler(async (req, ctx: { params: Promise<{ id: string }> }) => {
  await requireUser(req, { roles: ["ADMIN"] });
  const { id } = await ctx.params;
  const { isVerified } = await parseBody(req, bodySchema);

  const profile = await prisma.tutorProfile.update({
    where: { id },
    data: { isVerified },
    select: { id: true, isVerified: true },
  });
  return ok({ data: profile });
});
