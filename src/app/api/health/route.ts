import { ok, handler } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const GET = handler(async () => {
  await prisma.$queryRaw`SELECT 1`;
  return ok({ status: "ok" });
});
