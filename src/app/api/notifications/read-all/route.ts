import { handler, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const POST = handler(async (req) => {
  const user = await requireUser(req, { verified: false });
  await prisma.notification.updateMany({ where: { userId: user.id, isRead: false }, data: { isRead: true } });
  return ok({ success: true });
});