import { z } from "zod";
import { ApiError, created, handler, parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const bodySchema = z.object({
  tutorProfileId: z.string().min(1),
  message: z.string().trim().min(10).max(1000),
});

// Any signed-in, verified user can reach out to a tutor — students and parents share
// this one role (SEEKER) since they both do the same thing: look for a tutor.
export const POST = handler(async (req) => {
  const user = await requireUser(req);
  const { tutorProfileId, message } = await parseBody(req, bodySchema);

  const tutor = await prisma.tutorProfile.findFirst({
    where: { id: tutorProfileId, isVerified: true, isActive: true },
    select: { id: true, userId: true },
  });
  if (!tutor) throw new ApiError(404, "NOT_FOUND", "Tutor not found");
  if (tutor.userId === user.id) {
    throw new ApiError(400, "CANNOT_CONTACT_SELF", "You cannot send an inquiry to your own tutor profile");
  }

  const inquiry = await prisma.inquiry.create({
    data: { tutorProfileId, fromUserId: user.id, message },
    select: { id: true, status: true, message: true, createdAt: true },
  });

  return created({ data: inquiry });
});
