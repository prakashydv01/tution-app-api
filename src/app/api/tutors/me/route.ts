import { z } from "zod";
import { ApiError, handler, ok, parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { tutorDetailSelect } from "@/lib/tutor-select";
import { notifyUser } from "@/lib/notify";

const positiveId = z.number().int().positive();

const bodySchema = z
  .object({
    headline: z.string().trim().min(5).max(120),
    bio: z.string().trim().min(20).max(2000),
    experienceYears: z.number().int().min(0).max(60),
    feeMin: z.number().int().min(0).max(10_000_000).optional(),
    feeMax: z.number().int().min(0).max(10_000_000).optional(),
    feeUnit: z.enum(["HOUR", "MONTH"]).default("MONTH"),
    modes: z.array(z.enum(["HOME", "CENTER", "ONLINE"])).min(1),
    contactPhone: z.string().trim().min(7).max(20),
    cityId: positiveId,
    localityId: positiveId,
    subjectIds: z.array(positiveId).min(1).max(15),
    levelIds: z.array(positiveId).min(1).max(10),
  })
  .refine((d) => d.feeMin == null || d.feeMax == null || d.feeMin <= d.feeMax, {
    message: "feeMin cannot be greater than feeMax",
    path: ["feeMin"],
  });

export const GET = handler(async (req) => {
  const user = await requireUser(req, { roles: ["TUTOR"] });
  const profile = await prisma.tutorProfile.findUnique({
    where: { userId: user.id },
    select: tutorDetailSelect,
  });
  if (!profile) throw new ApiError(404, "NOT_FOUND", "You have not created a tutor profile yet");
  return ok({ data: profile });
});

export const PUT = handler(async (req) => {
  const user = await requireUser(req, { roles: ["TUTOR"] });
  const { subjectIds, levelIds, ...fields } = await parseBody(req, bodySchema);

  const subjects = [...new Set(subjectIds)];
  const levels = [...new Set(levelIds)];

  const [locality, subjectCount, levelCount] = await Promise.all([
    prisma.locality.findFirst({ where: { id: fields.localityId, cityId: fields.cityId } }),
    prisma.subject.count({ where: { id: { in: subjects } } }),
    prisma.level.count({ where: { id: { in: levels } } }),
  ]);
  if (!locality) throw new ApiError(400, "INVALID_LOCATION", "Locality does not belong to the selected city");
  if (subjectCount !== subjects.length) throw new ApiError(400, "INVALID_SUBJECTS", "One or more subjects do not exist");
  if (levelCount !== levels.length) throw new ApiError(400, "INVALID_LEVELS", "One or more levels do not exist");

  // Detected before the upsert, so we only notify admins when a tutor applies for the
  // first time — not on every subsequent edit of an already-submitted profile.
  const existingProfile = await prisma.tutorProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
  const isNewApplication = !existingProfile;

  const profile = await prisma.tutorProfile.upsert({
    where: { userId: user.id },
    create: {
      ...fields,
      userId: user.id,
      subjects: { connect: subjects.map((id) => ({ id })) },
      levels: { connect: levels.map((id) => ({ id })) },
    },
    update: {
      ...fields,
      subjects: { set: subjects.map((id) => ({ id })) },
      levels: { set: levels.map((id) => ({ id })) },
    },
    select: tutorDetailSelect,
  });

  if (isNewApplication) {
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true, expoPushToken: true } });
    await Promise.all(
      admins.map((admin) =>
        notifyUser({
          userId: admin.id,
          expoPushToken: admin.expoPushToken,
          type: "tutor_applied",
          title: "New tutor application",
          body: `${user.name} submitted a tutor profile for review.`,
          data: { tutorProfileId: profile.id },
        }),
      ),
    );
  }

  return ok({ data: profile });
});