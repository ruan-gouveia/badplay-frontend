"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { Film, Clapperboard, Users, Activity } from "lucide-react";

interface StatCard {
  label: string;
  value: number | null;
  icon: React.ReactNode;
  cor: string;
  corIcone: string;
}

export default function AdminDashboardPage() {
  const [totalFilmes, setTotalFilmes] = useState<number | null>(null);
  const [totalSeries, setTotalSeries] = useState<number | null>(null);
  const [totalUsuariosAtivos, setTotalUsuariosAtivos] = useState<number | null>(null);
  const [totalReproducoesHoje, setTotalReproducoesHoje] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const buscarDados = async () => {
      try {
        const [respFilmes, respSeries, respUsuarios, respReproducoes] = await Promise.allSettled([
          api.get("/filmes"),
          api.get("/series"),
          api.get("/usuarios/total-ativos"),
          api.get("/historico/total-hoje"),
        ]);

        if (respFilmes.status === "fulfilled") setTotalFilmes(respFilmes.value.data.length);
        if (respSeries.status === "fulfilled") setTotalSeries(respSeries.value.data.length);
        if (respUsuarios.status === "fulfilled") setTotalUsuariosAtivos(respUsuarios.value.data);
        if (respReproducoes.status === "fulfilled") setTotalReproducoesHoje(respReproducoes.value.data);
      } catch (error) {
        console.error("Erro ao buscar dados do dashboard", error);
      } finally {
        setCarregando(false);
      }
    };
    buscarDados();
  }, []);

  const cards: StatCard[] = [
    {
      label: "Filmes Cadastrados",
      value: totalFilmes,
      icon: <Film className="w-6 h-6" />,
      cor: "bg-blue-500/10",
      corIcone: "text-blue-500",
    },
    {
      label: "Séries Cadastradas",
      value: totalSeries,
      icon: <Clapperboard className="w-6 h-6" />,
      cor: "bg-purple-500/10",
      corIcone: "text-purple-500",
    },
    {
      label: "Usuários Ativos",
      value: totalUsuariosAtivos,
      icon: <Users className="w-6 h-6" />,
      cor: "bg-green-500/10",
      corIcone: "text-green-500",
    },
    {
      label: "Reproduções Hoje",
      value: totalReproducoesHoje,
      icon: <Activity className="w-6 h-6" />,
      cor: "bg-red-500/10",
      corIcone: "text-red-500",
    },
  ];

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
      <p className="text-gray-500 text-sm mb-8">Visão geral da plataforma em tempo real.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-[#111] p-6 rounded-xl border border-gray-800 flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-400 text-sm font-medium">{card.label}</p>
                <h3 className="text-3xl font-bold text-white mt-1">
                  {carregando ? (
                    <span className="inline-block w-12 h-8 bg-gray-800 rounded animate-pulse" />
                  ) : card.value !== null ? (
                    card.value
                  ) : (
                    <span className="text-gray-600 text-lg">—</span>
                  )}
                </h3>
              </div>
              <div className={`p-3 ${card.cor} ${card.corIcone} rounded-lg`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}