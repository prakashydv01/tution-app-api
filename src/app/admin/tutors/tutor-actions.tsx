"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TutorActions({ tutorId, isVerified }: { tutorId: string; isVerified: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function setVerified(next: boolean, kind: "approve" | "reject") {
    setLoading(kind);
    try {
      const res = await fetch(`/api/admin/tutors/${tutorId}/verify`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isVerified: next }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex shrink-0 gap-2">
      {!isVerified && (
        <button
          disabled={loading !== null}
          onClick={() => setVerified(true, "approve")}
          className="rounded-md border border-green-600 bg-green-600 px-3.5 py-1.5 text-[13px] text-white disabled:cursor-default disabled:opacity-50"
        >
          {loading === "approve" ? "Approving…" : "Approve"}
        </button>
      )}
      {isVerified && (
        <button
          disabled={loading !== null}
          onClick={() => setVerified(false, "reject")}
          className="rounded-md border border-red-600 bg-white px-3.5 py-1.5 text-[13px] text-red-600 disabled:cursor-default disabled:opacity-50"
        >
          {loading === "reject" ? "Revoking…" : "Revoke"}
        </button>
      )}
    </div>
  );
}
