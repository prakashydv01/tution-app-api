import { prisma } from "./prisma";

// Database-backed (not in-memory) so the limit holds even across multiple serverless
// function instances, where each request can land on a different process.
const WINDOW_MINUTES = 15;
const MAX_FAILURES_PER_IDENTIFIER = 5; // per email being guessed against
const MAX_FAILURES_PER_IP = 20; // per IP spraying many different emails

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterMinutes: number };

export async function checkLoginRateLimit(identifier: string, ip: string): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60_000);

  const [identifierFails, ipFails] = await Promise.all([
    prisma.loginAttempt.count({ where: { identifier, success: false, createdAt: { gte: windowStart } } }),
    prisma.loginAttempt.count({ where: { ip, success: false, createdAt: { gte: windowStart } } }),
  ]);

  if (identifierFails >= MAX_FAILURES_PER_IDENTIFIER || ipFails >= MAX_FAILURES_PER_IP) {
    return { allowed: false, retryAfterMinutes: WINDOW_MINUTES };
  }
  return { allowed: true };
}

export async function recordLoginAttempt(identifier: string, ip: string, success: boolean) {
  await prisma.loginAttempt.create({ data: { identifier, ip, success } });
}