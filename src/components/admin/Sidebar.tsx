"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Film, Clapperboard, LogOut } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { nomeUsuario, logout } = useAuth();

  const menuItems = [
    { name: "Dashboard", path: "/admin", icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: "Gerenciar Filmes", path: "/admin/filmes", icon: <Film className="w-5 h-5" /> },
    { name: "Gerenciar Séries", path: "/admin/series", icon: <Clapperboard className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-[#111111] border-r border-gray-800 flex-col hidden md:flex min-h-screen sticky top-0">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-red-600 tracking-widest">
          BADPLAY <span className="text-white text-sm font-normal ml-1">ADMIN</span>
        </h1>
      </div>

      <nav className="flex-grow p-4 flex flex-col gap-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
                isActive ? "bg-red-600 text-white" : "text-gray-400 hover:text-white hover:bg-[#222]"
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center justify-between px-2 mb-4">
          <span className="text-sm text-gray-300 font-semibold">{nomeUsuario}</span>
          <span className="bg-red-900/30 text-red-500 text-[10px] px-2 py-0.5 rounded font-bold">ADMIN</span>
        </div>
        <button onClick={logout} className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-400 hover:text-red-500 hover:bg-[#222] transition-colors font-medium">
          <LogOut className="w-5 h-5" /> Sair do Painel
        </button>
      </div>
    </aside>
  );
}