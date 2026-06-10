"use client";

import { useEffect, useState } from "react";
import { buscarFilmesCache } from "@/services/catalogoCache";
import { Filme } from "@/types/conteudo";
import PageWrapper from "@/components/PageWrapper";
import CardConteudo from "@/components/shared/CardConteudo";
import { Film } from "lucide-react";

export default function FilmesPage() {
  const [filmes, setFilmes] = useState<Filme[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    const buscarFilmes = async () => {
      try {
        const dados = await buscarFilmesCache();

        if (ativo) {
          setFilmes(dados);
        }
      } catch (error) {
        console.error("Erro ao buscar filmes", error);
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    };

    buscarFilmes();

    return () => {
      ativo = false;
    };
  }, []);

  return (
    <PageWrapper hasNavbar={true}>
      <div className="w-full min-h-screen pt-24 px-6 md:px-12 pb-20">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 flex items-center gap-3">
          <Film className="w-8 h-8 text-red-600" />
          Filmes
        </h2>

        {carregando ? (
          <p className="text-gray-400">Carregando...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-8">
            {filmes.map((filme) => (
              <CardConteudo
                key={filme.id}
                id={filme.id}
                titulo={filme.titulo}
                capaUrlMinio={filme.capaUrlMinio}
                planoMinimo={filme.planoMinimo}
                anoLancamento={filme.anoLancamento}
                mostrarDetalhes={true}
              />
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}