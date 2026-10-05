import type { ReactNode } from "react";
import Link from "next/link";
import "./admin.css";
import { LogoutButton } from "./logout-button";

export const metadata = { title: "Tuition Finder Admin" };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="m-0 bg-gray-50 font-sans text-gray-900 antialiased">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3.5">
          <div className="flex items-center gap-6">
            <h1 className="m-0 text-base font-semibold">Tuition Finder — Admin</h1>
            <nav className="flex gap-4">
              <Link href="/admin/tutors" className="text-sm text-gray-500 hover:text-gray-900">
                Tutors
              </Link>
              <Link href="/admin/cities" className="text-sm text-gray-500 hover:text-gray-900">
                Cities
              </Link>
            </nav>
          </div>
          <LogoutButton />
        </header>
        <main className="mx-auto max-w-3xl p-6">{children}</main>
      </body>
    </html>
  );
}