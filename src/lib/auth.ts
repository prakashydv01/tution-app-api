import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import type { Role } from "@/generated/prisma/enums";
import { getEnv } from "./env";
import { prisma } from "./prisma";
import { ApiError } from "./http";
import { ADMIN_COOKIE } from "./constants";

export { ADMIN_COOKIE };
const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const secretKey = () => new TextEncoder().encode(getEnv().JWT_SECRET);

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
  return payload;
}

export const hashPassword = (password: string) => bcrypt.hash(password, 12);

let dummyHash: Promise<string> | undefined;
export const getDummyHash = () => (dummyHash ??= bcrypt.hash("not-a-real-password", 12));

export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

/**
 * Creates a Session row (so this specific login can be revoked later — logout,
 * lost device) and signs a JWT carrying that session's id as "sid". A JWT alone
 * can't be revoked before it expires; checking the session row on every request
 * is what makes logout actually invalidate the token, not just forget it locally.
 */
export async function signAccessToken(user: { id: string; role: Role }) {
  const expiresAt = new Date(Date.now() + TOKEN_TTL_SECONDS * 1000);
  const session = await prisma.session.create({
    data: { userId: user.id, expiresAt },
    select: { id: true },
  });

  return new SignJWT({ role: user.role, sid: session.id })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(secretKey());
}

function extractToken(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (header?.startsWith("Bearer ")) return header.slice(7);

  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function getUserFromRequest(req: Request) {
  const token = extractToken(req);
  if (!token) return null;
  try {
    const payload = await verifyToken(token);
    if (!payload.sub || typeof payload.sid !== "string") return null;

    const session = await prisma.session.findUnique({
      where: { id: payload.sid },
      select: { revokedAt: true, expiresAt: true },
    });
    if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) return null;

    return await prisma.user.findUnique({ where: { id: payload.sub } });
  } catch {
    return null;
  }
}

export async function requireUser(req: Request, opts: { verified?: boolean; roles?: Role[] } = {}) {
  const user = await getUserFromRequest(req);
  if (!user) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  if (opts.verified !== false && !user.emailVerifiedAt) {
    throw new ApiError(403, "EMAIL_NOT_VERIFIED", "Please verify your email first");
  }
  if (opts.roles && !opts.roles.includes(user.role)) {
    throw new ApiError(403, "FORBIDDEN", "You do not have access to this resource");
  }
  return user;
}

/** Revokes whatever session the request's token points to, if any. Used by logout
 * endpoints. Silently no-ops on a missing/invalid/already-expired token — logout
 * should never fail just because the token was already no good. */
export async function revokeCurrentSession(req: Request) {
  const token = extractToken(req);
  if (!token) return;
  try {
    const payload = await verifyToken(token);
    if (typeof payload.sid === "string") {
      await prisma.session.updateMany({
        where: { id: payload.sid, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  } catch {
    // Invalid or expired token — nothing to revoke.
  }
}