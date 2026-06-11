"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { api } from "@/services/api";
import { Filme, Serie } from "@/types/conteudo";
import PageWrapper from "@/components/PageWrapper";
import CardConteudo from "@/components/shared/CardConteudo";

const fetcher = (url: string) => api.get(url).then(res => {
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.content)) return res.data.content;
  return [];
});

function BuscaContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || ""; 

  const { data: filmesData, isLoading: loadFilmes } = useSWR<Filme[]>("/filmes", fetcher);
  const { data: seriesData, isLoading: loadSeries } = useSWR<Serie[]>("/series", fetcher);

  const carregando = loadFilmes || loadSeries;

  const filmesSeguros = Array.isArray(filmesData) ? filmesData : [];
  const seriesSeguras = Array.isArray(seriesData) ? seriesData : [];

  const todosConteudos = [...filmesSeguros, ...seriesSeguras];
  
  const unicos = todosConteudos
    .filter((v, i, a) => a.findIndex(t => t.titulo === v.titulo) === i)
    .sort((a, b) => a.titulo.localeCompare(b.titulo));

  const resultados = unicos.filter((c) => 
    c.titulo.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="w-full min-h-screen pt-24 px-6 md:px-12 pb-20">
      <h2 className="text-2xl font-bold text-gray-400 mb-8">
        Resultados para: <span className="text-white">"{query}"</span>
      </h2>

      {carregando ? (
        <p className="text-gray-500">Buscando...</p>
      ) : resultados.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4 gap-y-8">
          {resultados.map((item) => (
            <CardConteudo 
              key={item.id} 
              id={item.id} 
              titulo={item.titulo} 
              capaUrlMinio={item.capaUrlMinio} 
              planoMinimo={item.planoMinimo} 
              anoLancamento={item.anoLancamento} 
              mostrarDetalhes={true} 
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-500">Nenhum conteúdo encontrado para esta busca.</p>
      )}
    </div>
  );
}

export default function BuscaPage() {
  return (
    <PageWrapper hasNavbar={true}>
      <Suspense fallback={<div className="text-white mt-32">Carregando...</div>}>
        <BuscaContent />
      </Suspense>
    </PageWrapper>
  );
}