import type { User } from "@/generated/prisma/client";

export const publicUser = (u: User) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  phone: u.phone,
  role: u.role,
  emailVerified: u.emailVerifiedAt !== null,
  createdAt: u.createdAt,
});
