import { z } from "zod";
import { ApiError, emailSchema, handler, ok, parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE, getDummyHash, signAccessToken, verifyPassword } from "@/lib/auth";
import { publicUser } from "@/lib/serializers";
import { checkLoginRateLimit, getClientIp, recordLoginAttempt } from "@/lib/rate-limit";

const bodySchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(72),
});

// Same credential check as /api/auth/login, but only ADMIN accounts may sign in,
// and the token is set as an httpOnly cookie instead of returned in the body.
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
  const success = Boolean(user) && passwordOk && user?.role === "ADMIN";

  await recordLoginAttempt(email, ip, success);

  if (!success || !user) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Incorrect email or password");
  }

  const token = await signAccessToken(user);
  const res = ok({ user: publicUser(user) });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days, matches the token's own expiry
  });
  return res;
});