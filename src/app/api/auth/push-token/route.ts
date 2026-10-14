import { z } from "zod";
import { handler, ok, parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const bodySchema = z.object({ token: z.string().trim().min(10).max(200) });

export const POST = handler(async (req) => {
  const user = await requireUser(req, { verified: false });
  const { token } = await parseBody(req, bodySchema);
  await prisma.user.update({ where: { id: user.id }, data: { expoPushToken: token } });
  return ok({ success: true });
});