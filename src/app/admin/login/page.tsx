"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? "Login failed");
        return;
      }
      router.push("/admin/tutors");
      router.refresh();
    } catch {
      setError("Could not reach the server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form
        className="w-80 rounded-xl border border-gray-200 bg-white p-7"
        onSubmit={onSubmit}
      >
        <h1 className="m-0 mb-[18px] text-lg font-semibold">Admin sign in</h1>

        <div className="mb-3">
          <label htmlFor="email" className="mb-1 block text-[13px] text-gray-500">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            className="w-full rounded-md border border-gray-200 px-2.5 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-3">
          <label htmlFor="password" className="mb-1 block text-[13px] text-gray-500">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-gray-200 px-2.5 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md border border-green-600 bg-green-600 px-3.5 py-1.5 text-[13px] text-white disabled:cursor-default disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        {error && <p className="mt-2.5 text-[13px] text-red-600">{error}</p>}
      </form>
    </div>
  );
}
