import { z } from "zod";
import { ApiError, handler, ok, parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

async function loadOwned(id: string, userId: string) {
  const requirement = await prisma.requirement.findUnique({ where: { id }, select: { id: true, userId: true } });
  if (!requirement) throw new ApiError(404, "NOT_FOUND", "Requirement not found");
  if (requirement.userId !== userId) throw new ApiError(403, "FORBIDDEN", "This is not your requirement");
  return requirement;
}

const bodySchema = z.object({ isActive: z.boolean() });

// The author closes (or reopens) their own posting once they've found a tutor.
export const PATCH = handler(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(req);
  const { id } = await ctx.params;
  await loadOwned(id, user.id);
  const { isActive } = await parseBody(req, bodySchema);

  const updated = await prisma.requirement.update({
    where: { id },
    data: { isActive },
    select: { id: true, isActive: true },
  });
  return ok({ data: updated });
});

// The author removes their own posting entirely.
export const DELETE = handler(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(req);
  const { id } = await ctx.params;
  await loadOwned(id, user.id);

  await prisma.requirement.delete({ where: { id } });
  return ok({ success: true });
});