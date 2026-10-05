/**
 * Create or promote an admin account directly in the database — no register/verify flow needed.
 *
 * Usage:
 *   npm run admin:create -- --email you@example.com --password "a strong password" --name "Your Name"
 *
 * If the email already exists, its role is set to ADMIN and the password is updated.
 * The admin flow never checks emailVerifiedAt, so this account can log in at /admin/login immediately.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth";

function readArg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

async function main() {
  const email = readArg("--email")?.trim().toLowerCase();
  const password = readArg("--password");
  const name = readArg("--name") ?? "Admin";

  if (!email || !password) {
    console.error('Usage: npm run admin:create -- --email you@example.com --password "..." --name "Your Name"');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  console.log(`Connecting to database and upserting ${email}...`);

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", passwordHash },
    create: { email, name, passwordHash, role: "ADMIN", emailVerifiedAt: new Date() },
    select: { id: true, email: true, role: true },
  });

  console.log(`OK: ${user.email} is now ADMIN (id: ${user.id}). Sign in at /admin/login.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
