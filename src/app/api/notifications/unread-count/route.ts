import { handler, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

// Lightweight — meant to be polled often (app foreground, tab focus) for the bell badge.
export const GET = handler(async (req) => {
  const user = await requireUser(req, { verified: false });
  const count = await prisma.notification.count({ where: { userId: user.id, isRead: false } });
  return ok({ count });
});