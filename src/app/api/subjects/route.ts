import { handler, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const GET = handler(async () => {
  const subjects = await prisma.subject.findMany({ orderBy: { name: "asc" } });
  return ok({ data: subjects }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
});
