import { z } from "zod";
import { handler, ok, parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { notifyUser } from "@/lib/notify";

const bodySchema = z.object({ isVerified: z.boolean() });

export const PATCH = handler(async (req, ctx: { params: Promise<{ id: string }> }) => {
  await requireUser(req, { roles: ["ADMIN"] });
  const { id } = await ctx.params;
  const { isVerified } = await parseBody(req, bodySchema);

  const profile = await prisma.tutorProfile.update({
    where: { id },
    data: { isVerified },
    select: { id: true, isVerified: true, userId: true, user: { select: { expoPushToken: true } } },
  });

  if (isVerified) {
    await notifyUser({
      userId: profile.userId,
      expoPushToken: profile.user.expoPushToken,
      type: "tutor_verified",
      title: "Your profile is live!",
      body: "An admin approved your tutor profile. Students can now find and contact you.",
    });
  }

  return ok({ data: { id: profile.id, isVerified: profile.isVerified } });
});