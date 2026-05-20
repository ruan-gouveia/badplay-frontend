"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/services/api";
import { Filme, Serie } from "@/types/conteudo";
import Navbar from "@/components/Navbar";
import PageWrapper from "@/components/PageWrapper";

function BuscaContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || ""; // Pega o que o usuário digitou na URL

  const [resultados, setResultados] = useState<(Filme | Serie)[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const realizarBusca = async () => {
      setCarregando(true);
      try {
        const [respFilmes, respSeries] = await Promise.all([
          api.get<Filme[]>("/filmes"),
          api.get<Serie[]>("/series")
        ]);

        // Junta filmes e séries e filtra pelo título ignorando maiúsculas/minúsculas
        const todosConteudos = [...respFilmes.data, ...respSeries.data];
        const filtrados = todosConteudos.filter((c) => 
          c.titulo.toLowerCase().includes(query.toLowerCase())
        );

        setResultados(filtrados);
      } catch (error) {
        console.error("Erro na busca", error);
      } finally {
        setCarregando(false);
      }
    };

    if (query) realizarBusca();
  }, [query]);

  const getUrlImagem = (nomeArquivo: string) => {
    if (!nomeArquivo) return "https://via.placeholder.com/300x450?text=Sem+Capa";
    return `http://localhost:8080/api/arquivos/${nomeArquivo}`;
  };

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
            <div key={item.id} className="flex flex-col cursor-pointer group">
              <div className="relative aspect-[2/3] overflow-hidden rounded-md mb-2 border border-gray-800">
                <img src={getUrlImagem(item.capaUrlMinio)} alt={item.titulo} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              </div>
              <h3 className="text-sm font-semibold text-gray-200 truncate group-hover:text-white transition">{item.titulo}</h3>
            </div>
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
    <PageWrapper>
      <Navbar />
      <Suspense fallback={<div className="text-white mt-32">Carregando...</div>}>
        <BuscaContent />
      </Suspense>
    </PageWrapper>
  );
}