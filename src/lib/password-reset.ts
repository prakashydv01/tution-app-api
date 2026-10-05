import { prisma } from "./prisma";
import { ApiError } from "./http";
import { sendPasswordResetEmail } from "./email";
import { CODE_TTL_MINUTES, MAX_ATTEMPTS, RESEND_COOLDOWN_SECONDS, generateCode, hashCode, safeEqual } from "./otp";

const TAG = "password-reset";

export type IssueResult = { sent: true } | { sent: false; reason: "COOLDOWN" | "SEND_FAILED" };

export async function issuePasswordResetCode(user: {
  id: string;
  email: string;
  name: string;
}): Promise<IssueResult> {
  const latest = await prisma.passwordResetCode.findFirst({
    where: { userId: user.id, usedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (latest && Date.now() - latest.createdAt.getTime() < RESEND_COOLDOWN_SECONDS * 1000) {
    return { sent: false, reason: "COOLDOWN" };
  }

  const code = generateCode();
  const [, record] = await prisma.$transaction([
    prisma.passwordResetCode.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetCode.create({
      data: {
        userId: user.id,
        codeHash: hashCode(TAG, user.id, code),
        expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60_000),
      },
    }),
  ]);

  try {
    await sendPasswordResetEmail({ to: user.email, name: user.name, code, ttlMinutes: CODE_TTL_MINUTES });
    return { sent: true };
  } catch (e) {
    console.error("Failed to send password reset email:", e);
    await prisma.passwordResetCode.delete({ where: { id: record.id } }).catch(() => {});
    return { sent: false, reason: "SEND_FAILED" };
  }
}

/** Checks the code and sets the user's new password. Returns the updated user. */
export async function resetPassword(userId: string, code: string, newPasswordHash: string) {
  const record = await prisma.passwordResetCode.findFirst({
    where: { userId, usedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!record || record.expiresAt.getTime() < Date.now()) {
    throw new ApiError(400, "CODE_EXPIRED", "This code has expired. Request a new one.");
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    throw new ApiError(429, "TOO_MANY_ATTEMPTS", "Too many wrong attempts. Request a new code.");
  }
  if (!safeEqual(record.codeHash, hashCode(TAG, userId, code))) {
    await prisma.passwordResetCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    throw new ApiError(400, "INVALID_CODE", "The code is incorrect");
  }

  const now = new Date();
  const [, user] = await prisma.$transaction([
    prisma.passwordResetCode.update({ where: { id: record.id }, data: { usedAt: now } }),
    prisma.user.update({ where: { id: userId }, data: { passwordHash: newPasswordHash } }),
  ]);
  return user;
}