"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { Serie } from "@/types/conteudo";
import Navbar from "@/components/Navbar";
import PageWrapper from "@/components/PageWrapper";

export default function SeriesPage() {
  const [series, setSeries] = useState<Serie[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const buscarSeries = async () => {
      try {
        const resp = await api.get<Serie[]>("/series");
        setSeries(resp.data);
      } catch (error) {
        console.error("Erro ao buscar séries", error);
      } finally {
        setCarregando(false);
      }
    };
    buscarSeries();
  }, []);

  const getUrlImagem = (nomeArquivo: string) => {
    if (!nomeArquivo) return "https://via.placeholder.com/300x450?text=Sem+Capa";
    return `http://localhost:8080/api/arquivos/${nomeArquivo}`;
  };

  return (
    <PageWrapper>
      <Navbar />
      <div className="w-full min-h-screen pt-24 px-6 md:px-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-white">Séries</h2>
        </div>

        {carregando ? (
          <p className="text-gray-400">Carregando...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-8">
            {series.map((serie) => (
              <div key={serie.id} className="flex flex-col cursor-pointer group">
                <div className="relative aspect-[2/3] overflow-hidden rounded-md mb-2">
                  <img 
                    src={getUrlImagem(serie.capaUrlMinio)} 
                    alt={serie.titulo} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <h3 className="text-sm font-semibold text-gray-200 truncate group-hover:text-white transition">{serie.titulo}</h3>
                <p className="text-xs text-gray-500">{serie.anoLancamento}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}