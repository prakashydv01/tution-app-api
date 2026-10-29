import { z } from "zod";
import { ApiError, created, handler, parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { notifyUser } from "@/lib/notify";
import { checkRateLimit, recordRateLimitHit } from "@/lib/rate-limit";

const bodySchema = z.object({ tutorProfileId: z.string().min(1), message: z.string().trim().min(10).max(1000) });

// SECURITY: rate limited — prevents one account from mass-spamming every tutor
// on the platform with inquiries.
export const POST = handler(async (req) => {
  const user = await requireUser(req);
  const { tutorProfileId, message } = await parseBody(req, bodySchema);

  const limit = await checkRateLimit(`inquiry:user:${user.id}`, { windowMinutes: 60, max: 10 });
  if (!limit.allowed) throw new ApiError(429, "TOO_MANY_ATTEMPTS", `You're sending inquiries too quickly. Please try again in ${limit.retryAfterMinutes} minutes.`);
  await recordRateLimitHit(`inquiry:user:${user.id}`);

  const tutor = await prisma.tutorProfile.findFirst({ where: { id: tutorProfileId, isVerified: true, isActive: true }, select: { id: true, userId: true, user: { select: { expoPushToken: true } } } });
  if (!tutor) throw new ApiError(404, "NOT_FOUND", "Tutor not found");
  if (tutor.userId === user.id) throw new ApiError(400, "CANNOT_CONTACT_SELF", "You cannot send an inquiry to your own tutor profile");

  const inquiry = await prisma.inquiry.create({ data: { tutorProfileId, fromUserId: user.id, message }, select: { id: true, status: true, message: true, createdAt: true } });

  await notifyUser({ userId: tutor.userId, expoPushToken: tutor.user.expoPushToken, type: "inquiry_received", title: "New inquiry", body: `${user.name} is interested in your tutoring: "${message.slice(0, 80)}"`, data: { inquiryId: inquiry.id } });

  return created({ data: inquiry });
});