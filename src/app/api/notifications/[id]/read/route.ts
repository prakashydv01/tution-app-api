import { ApiError, handler, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const PATCH = handler(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(req, { verified: false });
  const { id } = await ctx.params;

  const notification = await prisma.notification.findUnique({ where: { id }, select: { userId: true } });
  if (!notification) throw new ApiError(404, "NOT_FOUND", "Notification not found");
  if (notification.userId !== user.id) throw new ApiError(403, "FORBIDDEN", "This is not your notification");

  const updated = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
    select: { id: true, isRead: true },
  });
  return ok({ data: updated });
});