"use client";

import { useRouter, usePathname } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === "/admin/login") return null;

  return (
    <button
      className="border-none bg-transparent p-0 text-sm text-gray-500 hover:text-gray-700"
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.push("/admin/login");
        router.refresh();
      }}
    >
      Log out
    </button>
  );
}
