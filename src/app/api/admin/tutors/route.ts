import { ADMIN_COOKIE, revokeCurrentSession } from "@/lib/auth";
import { handler, ok } from "@/lib/http";

export const POST = handler(async (req) => {
  await revokeCurrentSession(req);
  const res = ok({ success: true });
  res.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
});