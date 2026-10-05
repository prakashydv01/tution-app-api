import { z } from "zod";
import { ApiError, emailSchema, handler, ok, parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { signAccessToken } from "@/lib/auth";
import { verifyEmailCode } from "@/lib/verification";
import { publicUser } from "@/lib/serializers";

const bodySchema = z.object({
  email: emailSchema,
  code: z.string().regex(/^\d{6}$/, "Code must be 6 digits"),
});

export const POST = handler(async (req) => {
  const { email, code } = await parseBody(req, bodySchema);

  const user = await prisma.user.findUnique({ where: { email } });
  // Same error whether or not the account exists.
  if (!user) throw new ApiError(400, "INVALID_CODE", "The code is incorrect");

  if (user.emailVerifiedAt) {
    return ok({ alreadyVerified: true, message: "Email is already verified. Please log in." });
  }

  const verified = await verifyEmailCode(user.id, code);
  const token = await signAccessToken(verified);
  return ok({ token, user: publicUser(verified) });
});
