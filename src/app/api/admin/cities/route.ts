import { z } from "zod";
import { created, handler, ok, parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const GET = handler(async (req) => {
  await requireUser(req, { roles: ["ADMIN"] });
  const cities = await prisma.city.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, _count: { select: { localities: true, tutors: true } } },
  });
  return ok({ data: cities });
});

const bodySchema = z.object({ name: z.string().trim().min(2).max(80) });

export const POST = handler(async (req) => {
  await requireUser(req, { roles: ["ADMIN"] });
  const { name } = await parseBody(req, bodySchema);

  const city = await prisma.city.create({ data: { name }, select: { id: true, name: true } });
  return created({ data: city });
});