import { prisma } from "./prisma";

const WINDOW_MINUTES = 15;
const MAX_FAILURES_PER_IDENTIFIER = 5;
const MAX_FAILURES_PER_IP = 20;

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterMinutes: number };

// Login-specific: tracks success/failure so it only throttles actual wrong-password
// guessing, not every login attempt.
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

// Generic sliding-window limiter for any other write endpoint. Caller picks the
// key (e.g. `register:ip:1.2.3.4` or `inquiry:user:<id>`) and the window/max.
export async function checkRateLimit(
  key: string,
  opts: { windowMinutes: number; max: number },
): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - opts.windowMinutes * 60_000);
  const count = await prisma.rateLimitHit.count({ where: { key, createdAt: { gte: windowStart } } });
  if (count >= opts.max) return { allowed: false, retryAfterMinutes: opts.windowMinutes };
  return { allowed: true };
}

export async function recordRateLimitHit(key: string) {
  await prisma.rateLimitHit.create({ data: { key } });
}