import { z } from "zod";
import { ApiError, handler, ok, parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const bodySchema = z.object({ status: z.enum(["NEW", "CONTACTED", "CLOSED"]) });

// Only the tutor who received the inquiry can update its status.
export const PATCH = handler(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(req, { roles: ["TUTOR"] });
  const { id } = await ctx.params;
  const { status } = await parseBody(req, bodySchema);

  const inquiry = await prisma.inquiry.findUnique({
    where: { id },
    select: { id: true, tutorProfile: { select: { userId: true } } },
  });
  if (!inquiry) throw new ApiError(404, "NOT_FOUND", "Inquiry not found");
  if (inquiry.tutorProfile.userId !== user.id) {
    throw new ApiError(403, "FORBIDDEN", "This inquiry was not sent to you");
  }

  const updated = await prisma.inquiry.update({
    where: { id },
    data: { status },
    select: { id: true, status: true },
  });
  return ok({ data: updated });
});
