"use client";

import useSWR from "swr";
import { api } from "@/services/api";
import { Activity, Film, Users, Play, Loader2, AlertTriangle } from "lucide-react";

interface Estatisticas {
  filmesCadastrados: number;
  seriesCadastradas: number;
  usuariosAtivos: number;
  reproducoesHoje: number;
}

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function AdminDashboardPage() {
  // Pegamos também o "error" do SWR
  const { data: dados, error, isLoading } = useSWR<Estatisticas>("/estatisticas", fetcher);

  // SE DER ERRO NA API, MOSTRAMOS NA TELA!
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">
        <AlertTriangle className="w-16 h-16 text-red-600 mb-4" />
        <h2 className="text-2xl text-white font-bold mb-2">Erro de Conexão</h2>
        <p>Não foi possível carregar as estatísticas do Backend.</p>
        <p className="text-sm text-red-400 mt-2">Verifique se o endpoint /api/estatisticas existe no Java.</p>
      </div>
    );
  }

  if (isLoading || !dados) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-red-600" />
        <p>Carregando dados em tempo real...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-8">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-[#111] p-6 rounded-xl border border-gray-800 flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div><p className="text-gray-400 text-sm font-medium">Filmes Cadastrados</p><h3 className="text-3xl font-bold text-white mt-1">{dados.filmesCadastrados}</h3></div>
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg"><Film className="w-6 h-6" /></div>
          </div>
        </div>

        <div className="bg-[#111] p-6 rounded-xl border border-gray-800 flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div><p className="text-gray-400 text-sm font-medium">Séries Cadastradas</p><h3 className="text-3xl font-bold text-white mt-1">{dados.seriesCadastradas}</h3></div>
            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-lg"><Play className="w-6 h-6" /></div>
          </div>
        </div>

        <div className="bg-[#111] p-6 rounded-xl border border-gray-800 flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div><p className="text-gray-400 text-sm font-medium">Usuários Ativos</p><h3 className="text-3xl font-bold text-white mt-1">{dados.usuariosAtivos}</h3></div>
            <div className="p-3 bg-green-500/10 text-green-500 rounded-lg"><Users className="w-6 h-6" /></div>
          </div>
        </div>

        <div className="bg-[#111] p-6 rounded-xl border border-gray-800 flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div><p className="text-gray-400 text-sm font-medium">Reproduções Hoje</p><h3 className="text-3xl font-bold text-white mt-1">{dados.reproducoesHoje}</h3></div>
            <div className="p-3 bg-red-500/10 text-red-500 rounded-lg"><Activity className="w-6 h-6" /></div>
          </div>
        </div>
      </div>

      <div className="bg-[#111] border border-gray-800 rounded-xl p-8 text-center py-20 shadow-lg">
        <h3 className="text-xl font-bold text-white mb-2">Bem-vindo ao Centro de Comando</h3>
        <p className="text-gray-400 max-w-lg mx-auto">
          Utilize o menu lateral para gerenciar o catálogo. A integração com a TMDb API fará o trabalho pesado para você.
        </p>
      </div>
    </div>
  );
}