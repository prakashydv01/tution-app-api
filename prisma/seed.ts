import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Sample data: edit these lists to match the cities and subjects you launch with.
const cities: Record<string, string[]> = {
  Kathmandu: ["Baneshwor", "Koteshwor", "Baluwatar", "Kalanki"],
  Pokhara: ["Lakeside", "Chipledhunga", "Prithvi Chowk"],
};

const subjects = [
  "Mathematics", "Science", "English", "Physics", "Chemistry",
  "Biology", "Computer Science", "Accountancy", "Nepali", "Social Studies",
];

const levels = [
  "Primary (1-5)", "Lower Secondary (6-8)", "Secondary (9-10)",
  "Higher Secondary (11-12)", "Undergraduate", "Entrance Exam Prep",
];

async function main() {
  for (const [name, localities] of Object.entries(cities)) {
    const city = await prisma.city.upsert({ where: { name }, update: {}, create: { name } });
    for (const localityName of localities) {
      await prisma.locality.upsert({
        where: { cityId_name: { cityId: city.id, name: localityName } },
        update: {},
        create: { name: localityName, cityId: city.id },
      });
    }
  }
  for (const name of subjects) {
    await prisma.subject.upsert({ where: { name }, update: {}, create: { name } });
  }
  for (const [i, name] of levels.entries()) {
    await prisma.level.upsert({ where: { name }, update: { sortOrder: i }, create: { name, sortOrder: i } });
  }
  console.log("Seed complete");
}

main().finally(() => prisma.$disconnect());
