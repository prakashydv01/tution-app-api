"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function AddCityForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cities", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? "Could not add city");
        return;
      }
      setName("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mb-4 flex items-start gap-2">
      <div className="flex-1">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Pokhara"
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        {error && <p className="mt-1 text-[13px] text-red-600">{error}</p>}
      </div>
      <button
        type="submit"
        disabled={loading || name.trim().length < 2}
        className="rounded-md border border-blue-600 bg-blue-600 px-4 py-2 text-[13px] text-white disabled:cursor-default disabled:opacity-50"
      >
        {loading ? "Adding…" : "Add city"}
      </button>
    </form>
  );
}

export function DeleteCityButton({ cityId, inUse }: { cityId: number; inUse: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/cities/${cityId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? "Could not delete city");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={onDelete}
        disabled={loading || inUse}
        title={inUse ? "Remove its localities/tutors first" : undefined}
        className="rounded-md border border-red-600 bg-white px-3 py-1.5 text-[13px] text-red-600 disabled:cursor-default disabled:opacity-40"
      >
        {loading ? "Deleting…" : "Delete"}
      </button>
      {error && <p className="text-[12px] text-red-600">{error}</p>}
    </div>
  );
}