import { prisma } from "@/lib/prisma";
import { AddCityForm, DeleteCityButton } from "./city-actions";

export const dynamic = "force-dynamic";

export default async function AdminCitiesPage() {
  const cities = await prisma.city.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, _count: { select: { localities: true, tutors: true } } },
  });

  return (
    <>
      <h2 className="mb-4 text-lg font-semibold">Cities</h2>

      <AddCityForm />

      {cities.length === 0 && <p className="py-10 text-center text-gray-500">No cities yet — add one above.</p>}

      {cities.map((c) => {
        const inUse = c._count.localities > 0 || c._count.tutors > 0;
        return (
          <div key={c.id} className="mb-3 flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
            <div>
              <h3 className="m-0 text-[15px] font-semibold">{c.name}</h3>
              <p className="my-0.5 text-[13px] text-gray-500">
                {c._count.localities} localit{c._count.localities === 1 ? "y" : "ies"} · {c._count.tutors} tutor
                {c._count.tutors === 1 ? "" : "s"}
              </p>
            </div>
            <DeleteCityButton cityId={c.id} inUse={inUse} />
          </div>
        );
      })}
    </>
  );
}