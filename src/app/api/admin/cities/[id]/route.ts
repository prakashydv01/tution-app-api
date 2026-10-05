import { handler, idParam, ok, ApiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

// Fails with IN_USE (409) if any locality or tutor still references this city —
// the foreign key has no cascade, by design, so deleting a city never silently
// orphans or wipes out localities/tutors.
export const DELETE = handler(async (req, ctx: { params: Promise<{ id: string }> }) => {
  await requireUser(req, { roles: ["ADMIN"] });
  const parsed = idParam.safeParse((await ctx.params).id);
  if (!parsed.success) throw new ApiError(400, "VALIDATION_ERROR", "Invalid city id");

  await prisma.city.delete({ where: { id: parsed.data } });
  return ok({ success: true });
});