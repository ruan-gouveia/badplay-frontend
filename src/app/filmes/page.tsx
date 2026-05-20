"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { Filme } from "@/types/conteudo";
import Navbar from "@/components/Navbar";
import PageWrapper from "@/components/PageWrapper";

export default function FilmesPage() {
  const [filmes, setFilmes] = useState<Filme[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const buscarFilmes = async () => {
      try {
        const resp = await api.get<Filme[]>("/filmes");
        setFilmes(resp.data);
      } catch (error) {
        console.error("Erro ao buscar filmes", error);
      } finally {
        setCarregando(false);
      }
    };
    buscarFilmes();
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
          <h2 className="text-3xl font-bold text-white">Filmes</h2>
        </div>

        {carregando ? (
          <p className="text-gray-400">Carregando...</p>
        ) : (
          /* Grid Vertical Exatamente como nas suas prints */
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-8">
            {filmes.map((filme) => (
              <div key={filme.id} className="flex flex-col cursor-pointer group">
                <div className="relative aspect-[2/3] overflow-hidden rounded-md mb-2">
                  <img 
                    src={getUrlImagem(filme.capaUrlMinio)} 
                    alt={filme.titulo} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <h3 className="text-sm font-semibold text-gray-200 truncate group-hover:text-white transition">{filme.titulo}</h3>
                <p className="text-xs text-gray-500">{filme.anoLancamento}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}