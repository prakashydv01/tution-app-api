import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import type { Role } from "@/generated/prisma/enums";
import { getEnv } from "./env";
import { prisma } from "./prisma";
import { ApiError } from "./http";
import { ADMIN_COOKIE } from "./constants";

export { ADMIN_COOKIE };
const TOKEN_TTL = "7d";
const secretKey = () => new TextEncoder().encode(getEnv().JWT_SECRET);

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
  return payload;
}

export const hashPassword = (password: string) => bcrypt.hash(password, 12);

// Used to keep login timing similar whether or not the email exists.
let dummyHash: Promise<string> | undefined;
export const getDummyHash = () => (dummyHash ??= bcrypt.hash("not-a-real-password", 12));

export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export async function signAccessToken(user: { id: string; role: Role }) {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(secretKey());
}

function extractToken(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (header?.startsWith("Bearer ")) return header.slice(7);

  // Fallback for the admin web dashboard, which authenticates via an httpOnly cookie.
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Returns the signed-in user (fresh from the DB) or null. Never throws on bad tokens. */
export async function getUserFromRequest(req: Request) {
  const token = extractToken(req);
  if (!token) return null;
  try {
    const payload = await verifyToken(token);
    if (!payload.sub) return null;
    return await prisma.user.findUnique({ where: { id: payload.sub } });
  } catch {
    return null;
  }
}

export async function requireUser(
  req: Request,
  opts: { verified?: boolean; roles?: Role[] } = {},
) {
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
