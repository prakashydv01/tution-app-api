// Kept dependency-free (no prisma, no zod) so the edge middleware can import it
// without pulling in Node-only modules.
export const ADMIN_COOKIE = "admin_token";
