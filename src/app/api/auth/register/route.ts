import { z } from "zod";
import { ApiError, created, emailSchema, handler, parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { issueVerificationCode } from "@/lib/verification";
import { publicUser } from "@/lib/serializers";

const bodySchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailSchema,
  password: z.string().min(8).max(72),
  role: z.enum(["SEEKER", "TUTOR"]),
  phone: z.string().trim().min(7).max(20).optional(),
});

export const POST = handler(async (req) => {
  const body = await parseBody(req, bodySchema);

  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) {
    if (existing.emailVerifiedAt) {
      throw new ApiError(409, "EMAIL_TAKEN", "An account with this email already exists");
    }
    throw new ApiError(
      409,
      "EMAIL_NOT_VERIFIED",
      "This email is registered but not verified. Request a new verification code.",
    );
  }

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      phone: body.phone,
      role: body.role,
      passwordHash: await hashPassword(body.password),
    },
  });

  const result = await issueVerificationCode(user);

  return created({
    user: publicUser(user),
    emailSent: result.sent,
    message: result.sent
      ? "Account created. Enter the 6-digit code we emailed you."
      : "Account created, but the email could not be sent. Request a new code.",
  });
});
