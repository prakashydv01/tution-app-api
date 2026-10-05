import { z } from "zod";
import { ApiError, emailSchema, handler, ok, parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { hashPassword, signAccessToken } from "@/lib/auth";
import { resetPassword } from "@/lib/password-reset";
import { publicUser } from "@/lib/serializers";

const bodySchema = z.object({
  email: emailSchema,
  code: z.string().regex(/^\d{6}$/, "Code must be 6 digits"),
  newPassword: z.string().min(8).max(72),
});

// On success, signs the user in immediately (same as /api/auth/verify-email) so they
// don't have to re-enter the new password a second time right after setting it.
export const POST = handler(async (req) => {
  const { email, code, newPassword } = await parseBody(req, bodySchema);

  const user = await prisma.user.findUnique({ where: { email } });
  // Same error whether or not the account exists.
  if (!user) throw new ApiError(400, "INVALID_CODE", "The code is incorrect");

  const updated = await resetPassword(user.id, code, await hashPassword(newPassword));
  const token = await signAccessToken(updated);
  return ok({ token, user: publicUser(updated) });
});