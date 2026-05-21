"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/services/api";
import { Filme, Serie } from "@/types/conteudo";
import PageWrapper from "@/components/PageWrapper";
import CardConteudo from "@/components/shared/CardConteudo";

function BuscaContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || ""; 
  const [resultados, setResultados] = useState<(Filme | Serie)[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const realizarBusca = async () => {
      setCarregando(true);
      try {
        const [respFilmes, respSeries] = await Promise.all([ api.get<Filme[]>("/filmes"), api.get<Serie[]>("/series") ]);
        const todosConteudos = [...respFilmes.data, ...respSeries.data];
        const unicos = todosConteudos.filter((v, i, a) => a.findIndex(t => t.titulo === v.titulo) === i);
        setResultados(unicos.filter((c) => c.titulo.toLowerCase().includes(query.toLowerCase())));
      } catch (error) { console.error("Erro na busca", error); } 
      finally { setCarregando(false); }
    };
    if (query) realizarBusca();
  }, [query]);

  return (
    <div className="w-full min-h-screen pt-24 px-6 md:px-12">
      <h2 className="text-2xl font-bold text-gray-400 mb-8">
        Resultados para: <span className="text-white">"{query}"</span>
      </h2>
      {carregando ? (
        <p className="text-gray-500">Buscando...</p>
      ) : resultados.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-8 pb-20">
          {resultados.map((item) => (
            <CardConteudo key={item.id} id={item.id} titulo={item.titulo} capaUrlMinio={item.capaUrlMinio} planoMinimo={item.planoMinimo} anoLancamento={item.anoLancamento} mostrarDetalhes={true} />
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