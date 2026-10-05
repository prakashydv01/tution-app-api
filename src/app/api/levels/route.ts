import { handler, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const GET = handler(async () => {
  const levels = await prisma.level.findMany({ orderBy: { sortOrder: "asc" } });
  return ok({ data: levels }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
});
