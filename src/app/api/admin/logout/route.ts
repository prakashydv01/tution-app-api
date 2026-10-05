import { ADMIN_COOKIE } from "@/lib/auth";
import { handler, ok } from "@/lib/http";

export const POST = handler(async () => {
  const res = ok({ success: true });
  res.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
});
