import { handler, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const GET = handler(async () => {
  const cities = await prisma.city.findMany({ orderBy: { name: "asc" } });
  return ok({ data: cities }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
});
