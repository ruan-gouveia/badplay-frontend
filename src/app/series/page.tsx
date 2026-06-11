"use client";

import useSWR from "swr";
import { api } from "@/services/api";
import { Serie } from "@/types/conteudo";
import PageWrapper from "@/components/PageWrapper";
import CardConteudo from "@/components/shared/CardConteudo";
import { Clapperboard } from "lucide-react";

// Fetcher Blindado
const fetcher = (url: string) => api.get(url).then(res => {
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.content)) return res.data.content;
  return [];
});

export default function SeriesPage() {
  const { data: seriesData, isLoading: carregando } = useSWR<Serie[]>("/series", fetcher);

  const seriesSeguras = Array.isArray(seriesData) ? seriesData : [];
  const series = seriesSeguras
    .filter((v, i, a) => a.findIndex(t => t.titulo === v.titulo) === i)
    .sort((a, b) => a.titulo.localeCompare(b.titulo));

  return (
    <PageWrapper hasNavbar={true}>
      <div className="w-full min-h-screen pt-24 px-6 md:px-12 pb-20">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 flex items-center gap-3">
          <Clapperboard className="w-8 h-8 text-red-600" /> Séries
        </h2>

        {carregando ? (
          <p className="text-gray-400">Carregando...</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4 gap-y-8">
            {series.map((serie) => (
              <CardConteudo 
                key={serie.id} 
                id={serie.id} 
                titulo={serie.titulo} 
                capaUrlMinio={serie.capaUrlMinio} 
                planoMinimo={serie.planoMinimo} 
                anoLancamento={serie.anoLancamento} 
                mostrarDetalhes={true} 
              />
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}