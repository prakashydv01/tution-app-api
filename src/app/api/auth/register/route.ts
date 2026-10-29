import { z } from "zod";
import { ApiError, created, emailSchema, handler, parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { issueVerificationCode } from "@/lib/verification";
import { checkRateLimit, getClientIp, recordRateLimitHit } from "@/lib/rate-limit";

const bodySchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailSchema,
  password: z.string().min(8).max(72),
  role: z.enum(["SEEKER", "TUTOR"]),
  phone: z.string().trim().min(7).max(20).optional(),
});

const GENERIC_MESSAGE = "If this email can be used to create an account, we've sent a verification code to it.";

// SECURITY: this endpoint intentionally returns the exact same response (status,
// shape, message, timing) whether the email is new, already registered and
// unverified, or already registered and verified — so it can't be used to probe
// which email addresses have accounts (the same enumeration protection already
// applied to /api/auth/login and /api/auth/forgot-password).
export const POST = handler(async (req) => {
  const body = await parseBody(req, bodySchema);
  const ip = getClientIp(req);

  const limit = await checkRateLimit(`register:ip:${ip}`, { windowMinutes: 60, max: 5 });
  if (!limit.allowed) {
    throw new ApiError(429, "TOO_MANY_ATTEMPTS", `Too many registration attempts. Please try again in ${limit.retryAfterMinutes} minutes.`);
  }
  await recordRateLimitHit(`register:ip:${ip}`);

  // Always hash the password regardless of which branch runs below, so response
  // timing doesn't leak whether this email already has an account.
  const [existing, passwordHash] = await Promise.all([
    prisma.user.findUnique({ where: { email: body.email } }),
    hashPassword(body.password),
  ]);

  if (!existing) {
    const user = await prisma.user.create({
      data: { name: body.name, email: body.email, phone: body.phone, role: body.role, passwordHash },
    });
    await issueVerificationCode(user);
  } else if (!existing.emailVerifiedAt) {
    await issueVerificationCode(existing);
  }
  // existing && verified → do nothing: no new account, no email, but the
  // response is identical to every other case.

  return created({ message: GENERIC_MESSAGE });
});