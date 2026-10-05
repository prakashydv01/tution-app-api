import { handler, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { publicUser } from "@/lib/serializers";

export const GET = handler(async (req) => {
  const user = await requireUser(req, { verified: false });
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, isVerified: true, isActive: true },
  });
  return ok({ user: publicUser(user), tutorProfile });
});
