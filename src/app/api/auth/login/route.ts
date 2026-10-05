import { z } from "zod";
import { ApiError, emailSchema, handler, ok, parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getDummyHash, signAccessToken, verifyPassword } from "@/lib/auth";
import { publicUser } from "@/lib/serializers";
import { checkLoginRateLimit, getClientIp, recordLoginAttempt } from "@/lib/rate-limit";

const bodySchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(72),
});

export const POST = handler(async (req) => {
  const { email, password } = await parseBody(req, bodySchema);
  const ip = getClientIp(req);

  const limit = await checkLoginRateLimit(email, ip);
  if (!limit.allowed) {
    throw new ApiError(
      429,
      "TOO_MANY_ATTEMPTS",
      `Too many failed login attempts. Please try again in ${limit.retryAfterMinutes} minutes.`,
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const passwordOk = await verifyPassword(password, user?.passwordHash ?? (await getDummyHash()));

  await recordLoginAttempt(email, ip, Boolean(user) && passwordOk);

  if (!user || !passwordOk) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Incorrect email or password");
  }
  if (!user.emailVerifiedAt) {
    throw new ApiError(403, "EMAIL_NOT_VERIFIED", "Please verify your email to continue");
  }

  const token = await signAccessToken(user);
  return ok({ token, user: publicUser(user) });
});