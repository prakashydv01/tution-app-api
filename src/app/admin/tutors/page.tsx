import { prisma } from "@/lib/prisma";
import { TutorActions } from "./tutor-actions";

export const dynamic = "force-dynamic";

type Status = "pending" | "verified";

// Server component: middleware already confirmed the admin cookie, so this reads
// straight from the database instead of calling the API over HTTP.
export default async function AdminTutorsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const status: Status = (await searchParams).status === "verified" ? "verified" : "pending";

  const tutors = await prisma.tutorProfile.findMany({
    where: { isVerified: status === "verified" },
    orderBy: { createdAt: status === "pending" ? "asc" : "desc" },
    select: {
      id: true,
      headline: true,
      experienceYears: true,
      isVerified: true,
      createdAt: true,
      contactPhone: true,
      user: { select: { name: true, email: true } },
      city: { select: { name: true } },
      locality: { select: { name: true } },
      subjects: { select: { name: true } },
      levels: { select: { name: true } },
    },
  });

  const tabClass = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-[13px] no-underline ${
      active ? "border-blue-600 bg-blue-600 text-white" : "border-gray-200 text-gray-900"
    }`;

  return (
    <>
      <div className="mb-4 flex gap-2">
        <a className={tabClass(status === "pending")} href="/admin/tutors?status=pending">
          Pending
        </a>
        <a className={tabClass(status === "verified")} href="/admin/tutors?status=verified">
          Verified
        </a>
      </div>

      {tutors.length === 0 && (
        <p className="py-10 text-center text-gray-500">
          {status === "pending" ? "No tutors waiting for review." : "No verified tutors yet."}
        </p>
      )}

      {tutors.map((t) => (
        <div className="mb-3 rounded-xl border border-gray-200 bg-white p-4" key={t.id}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="m-0 mb-1 text-[15px] font-semibold">
                {t.user.name} — {t.headline}
              </h3>
              <p className="my-0.5 text-[13px] text-gray-500">
                {t.user.email} · {t.contactPhone}
              </p>
              <p className="my-0.5 text-[13px] text-gray-500">
                {t.city.name}, {t.locality.name} · {t.experienceYears} yrs experience
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {t.subjects.map((s) => (
                  <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs text-indigo-800" key={s.name}>
                    {s.name}
                  </span>
                ))}
                {t.levels.map((l) => (
                  <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs text-indigo-800" key={l.name}>
                    {l.name}
                  </span>
                ))}
              </div>
            </div>
            <TutorActions tutorId={t.id} isVerified={t.isVerified} />
          </div>
        </div>
      ))}
    </>
  );
}
