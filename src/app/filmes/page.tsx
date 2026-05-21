"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { Filme } from "@/types/conteudo";
import PageWrapper from "@/components/PageWrapper";
import CardConteudo from "@/components/shared/CardConteudo"; // Importando o Componente

export default function FilmesPage() {
  const [filmes, setFilmes] = useState<Filme[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const buscarFilmes = async () => {
      try {
        const resp = await api.get<Filme[]>("/filmes");
        const unicos = resp.data.filter((v, i, a) => a.findIndex(t => t.titulo === v.titulo) === i);
        setFilmes(unicos);
      } catch (error) { console.error("Erro ao buscar filmes", error); } 
      finally { setCarregando(false); }
    };
    buscarFilmes();
  }, []);

  return (
    <PageWrapper hasNavbar={true}>
      <div className="w-full min-h-screen pt-24 px-6 md:px-12 pb-20">
        <h2 className="text-3xl font-bold text-white mb-8">Filmes</h2>
        {carregando ? (
          <p className="text-gray-400">Carregando...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-8">
            {filmes.map((filme) => (
              <CardConteudo key={filme.id} id={filme.id} titulo={filme.titulo} capaUrlMinio={filme.capaUrlMinio} planoMinimo={filme.planoMinimo} anoLancamento={filme.anoLancamento} mostrarDetalhes={true} />
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}