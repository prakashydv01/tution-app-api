import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { getEnv } from "./env";

// Shared by email verification and password reset — both are "enter the 6-digit code
// we emailed you" flows with identical throttling rules.
export const CODE_TTL_MINUTES = 10;
export const RESEND_COOLDOWN_SECONDS = 60;
export const MAX_ATTEMPTS = 5;

export const generateCode = () => randomInt(0, 1_000_000).toString().padStart(6, "0");

// `tag` namespaces the hash so a leaked verification-code hash can't be replayed
// against the password-reset endpoint (or vice versa) for the same user+code.
export const hashCode = (tag: string, userId: string, code: string) =>
  createHmac("sha256", getEnv().JWT_SECRET).update(`${tag}:${userId}:${code}`).digest("hex");

export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}