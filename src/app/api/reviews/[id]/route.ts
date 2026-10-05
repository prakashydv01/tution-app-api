import { ApiError, handler, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

// The review's author can remove their own review.
export const DELETE = handler(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(req);
  const { id } = await ctx.params;

  const review = await prisma.review.findUnique({ where: { id }, select: { authorId: true } });
  if (!review) throw new ApiError(404, "NOT_FOUND", "Review not found");
  if (review.authorId !== user.id) throw new ApiError(403, "FORBIDDEN", "This is not your review");

  await prisma.review.delete({ where: { id } });
  return ok({ success: true });
});
