import { z } from "zod";
import { ApiError, handler, idParam, ok, parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const GET = handler(async (_req, ctx: { params: Promise<{ cityId: string }> }) => {
  const parsed = idParam.safeParse((await ctx.params).cityId);
  if (!parsed.success) throw new ApiError(400, "VALIDATION_ERROR", "Invalid city id");

  const localities = await prisma.locality.findMany({
    where: { cityId: parsed.data },
    orderBy: { name: "asc" },
    select: { id: true, name: true, cityId: true },
  });
  return ok({ data: localities }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
});

const bodySchema = z.object({ name: z.string().trim().min(2).max(80) });

// Find-or-create: lets a tutor type their own locality instead of picking from a fixed list.
export const POST = handler(async (req, ctx: { params: Promise<{ cityId: string }> }) => {
  await requireUser(req, { roles: ["TUTOR"] });
  const parsed = idParam.safeParse((await ctx.params).cityId);
  if (!parsed.success) throw new ApiError(400, "VALIDATION_ERROR", "Invalid city id");
  const cityId = parsed.data;

  const city = await prisma.city.findUnique({ where: { id: cityId }, select: { id: true } });
  if (!city) throw new ApiError(404, "NOT_FOUND", "City not found");

  const { name } = await parseBody(req, bodySchema);

  const locality = await prisma.locality.upsert({
    where: { cityId_name: { cityId, name } },
    update: {},
    create: { cityId, name },
    select: { id: true, name: true, cityId: true },
  });

  return ok({ data: locality });
});