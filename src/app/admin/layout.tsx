"use client";

import AdminGuard from "@/components/shared/AdminGuard";
import Sidebar from "@/components/admin/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="h-screen overflow-hidden bg-[#0a0a0a] flex">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto h-full custom-scrollbar">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}