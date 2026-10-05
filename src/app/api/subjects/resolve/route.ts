import { z } from "zod";
import { handler, ok, parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const bodySchema = z.object({
  names: z.array(z.string().trim().min(1).max(60)).min(1).max(15),
});

// Find-or-create: lets a tutor type the subjects they teach instead of picking from a fixed list.
// Matching is exact (case-sensitive) on the trimmed name, so "Math" and "math" become two rows —
// acceptable for now, but worth normalizing casing later if duplicates pile up.
export const POST = handler(async (req) => {
  await requireUser(req, { roles: ["TUTOR"] });
  const { names } = await parseBody(req, bodySchema);

  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))];

  const subjects = await Promise.all(
    unique.map((name) =>
      prisma.subject.upsert({
        where: { name },
        update: {},
        create: { name },
        select: { id: true, name: true },
      }),
    ),
  );

  return ok({ data: subjects });
});