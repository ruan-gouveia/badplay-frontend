"use client";

import { Activity, Film, Users, Play } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-8">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-[#111] p-6 rounded-xl border border-gray-800 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div><p className="text-gray-400 text-sm font-medium">Filmes Cadastrados</p><h3 className="text-3xl font-bold text-white mt-1">124</h3></div>
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg"><Film className="w-6 h-6" /></div>
          </div>
        </div>
        <div className="bg-[#111] p-6 rounded-xl border border-gray-800 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div><p className="text-gray-400 text-sm font-medium">Séries Cadastradas</p><h3 className="text-3xl font-bold text-white mt-1">42</h3></div>
            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-lg"><Play className="w-6 h-6" /></div>
          </div>
        </div>
        <div className="bg-[#111] p-6 rounded-xl border border-gray-800 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div><p className="text-gray-400 text-sm font-medium">Usuários Ativos</p><h3 className="text-3xl font-bold text-white mt-1">8.549</h3></div>
            <div className="p-3 bg-green-500/10 text-green-500 rounded-lg"><Users className="w-6 h-6" /></div>
          </div>
        </div>
        <div className="bg-[#111] p-6 rounded-xl border border-gray-800 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div><p className="text-gray-400 text-sm font-medium">Reproduções Hoje</p><h3 className="text-3xl font-bold text-white mt-1">45K</h3></div>
            <div className="p-3 bg-red-500/10 text-red-500 rounded-lg"><Activity className="w-6 h-6" /></div>
          </div>
        </div>
      </div>
    </div>
  );
}