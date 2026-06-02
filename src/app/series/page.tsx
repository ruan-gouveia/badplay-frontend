"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { Serie } from "@/types/conteudo";
import PageWrapper from "@/components/PageWrapper";
import CardConteudo from "@/components/shared/CardConteudo";
import { Clapperboard } from "lucide-react";

export default function SeriesPage() {
  const [series, setSeries] = useState<Serie[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const buscarSeries = async () => {
      try {
        const resp = await api.get<Serie[]>("/series");
        const unicas = resp.data.filter((v, i, a) => a.findIndex(t => t.titulo === v.titulo) === i);
        setSeries(unicas.sort((a, b) => a.titulo.localeCompare(b.titulo)));
      } catch (error) { console.error("Erro ao buscar séries", error); } 
      finally { setCarregando(false); }
    };
    buscarSeries();
  }, []);

  return (
    <PageWrapper hasNavbar={true}>
      <div className="w-full min-h-screen pt-24 px-6 md:px-12 pb-20">
        
        {/* Título com Ícone */}
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 flex items-center gap-3">
          <Clapperboard className="w-8 h-8 text-red-600" />
          Séries
        </h2>

        {carregando ? (
          <p className="text-gray-400">Carregando...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-8">
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