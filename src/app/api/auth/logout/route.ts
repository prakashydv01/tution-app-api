import { handler, ok } from "@/lib/http";
import { revokeCurrentSession } from "@/lib/auth";

export const POST = handler(async (req) => {
  await revokeCurrentSession(req);
  return ok({ success: true });
});