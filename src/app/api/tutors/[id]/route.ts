import { ApiError, handler, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { tutorDetailSelect } from "@/lib/tutor-select";

export const GET = handler(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;

  const [tutor, ratingSummary] = await Promise.all([
    prisma.tutorProfile.findFirst({
      where: { id, isVerified: true, isActive: true },
      select: tutorDetailSelect,
    }),
    prisma.review.aggregate({
      where: { tutorProfileId: id },
      _avg: { rating: true },
      _count: true,
    }),
  ]);
  if (!tutor) throw new ApiError(404, "NOT_FOUND", "Tutor not found");

  // Phone number is only shown to signed-in users with a verified email.
  const viewer = await getUserFromRequest(req);
  const canSeeContact = viewer?.emailVerifiedAt != null;
  const { contactPhone, ...rest } = tutor;

  return ok({
    data: {
      ...rest,
      contactPhone: canSeeContact ? contactPhone : null,
      contactVisible: canSeeContact,
      averageRating: ratingSummary._avg.rating ? Math.round(ratingSummary._avg.rating * 10) / 10 : null,
      reviewCount: ratingSummary._count,
    },
  });
});
