import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { ADMIN_COOKIE } from "@/lib/constants";

// Runs on the Edge runtime, so it only checks the JWT's signature and role claim —
// it never touches the database. Route handlers still re-check the real user server-side.
export async function proxy(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  const loginUrl = new URL("/admin/login", req.url);

  if (!token) return NextResponse.redirect(loginUrl);

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    if (payload.role !== "ADMIN") return NextResponse.redirect(loginUrl);
  } catch {
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/((?!login).*)"],
};
