import { z } from "zod";
import { emailSchema, handler, ok, parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { issueVerificationCode } from "@/lib/verification";

const bodySchema = z.object({ email: emailSchema });

export const POST = handler(async (req) => {
  const { email } = await parseBody(req, bodySchema);

  const user = await prisma.user.findUnique({ where: { email } });
  if (user && !user.emailVerifiedAt) {
    await issueVerificationCode(user);
  }

  // Always the same response, so this endpoint can't be used to discover registered emails.
  return ok({ message: "If this email needs verification, a new code has been sent." });
});
