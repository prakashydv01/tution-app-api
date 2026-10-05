import { z } from "zod";
import { emailSchema, handler, ok, parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { issuePasswordResetCode } from "@/lib/password-reset";

const bodySchema = z.object({ email: emailSchema });

export const POST = handler(async (req) => {
  const { email } = await parseBody(req, bodySchema);

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    await issuePasswordResetCode(user);
  }

  // Always the same response, whether or not the email is registered —
  // otherwise this endpoint could be used to check which emails have accounts.
  return ok({ message: "If an account exists for this email, a reset code has been sent." });
});