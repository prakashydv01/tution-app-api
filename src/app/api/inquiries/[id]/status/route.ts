import { z } from "zod";
import { ApiError, handler, ok, parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { notifyUser } from "@/lib/notify";

const bodySchema = z.object({ status: z.enum(["NEW", "CONTACTED", "CLOSED"]) });

export const PATCH = handler(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(req, { roles: ["TUTOR"] });
  const { id } = await ctx.params;
  const { status } = await parseBody(req, bodySchema);

  const inquiry = await prisma.inquiry.findUnique({
    where: { id },
    select: {
      id: true,
      tutorProfile: { select: { userId: true, headline: true } },
      fromUser: { select: { id: true, expoPushToken: true } },
    },
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

  if (status === "CONTACTED") {
    await notifyUser({
      userId: inquiry.fromUser.id,
      expoPushToken: inquiry.fromUser.expoPushToken,
      type: "inquiry_contacted",
      title: "A tutor responded",
      body: `${user.name} marked your inquiry as contacted.`,
      data: { inquiryId: updated.id },
    });
  }

  return ok({ data: updated });
});