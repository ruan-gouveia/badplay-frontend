"use client";

import { useState } from "react";
import useSWR from "swr";
import { api } from "@/services/api";
import { Filme, Serie, Genero } from "@/types/conteudo";
import PageWrapper from "@/components/PageWrapper";
import CardConteudo from "@/components/shared/CardConteudo";
import { Film, Clapperboard, SearchCheck, Popcorn } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Fetcher Blindado
const fetcher = (url: string) => api.get(url).then(res => {
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.content)) return res.data.content;
  return [];
});

export default function GenerosPage() {
  const { data: generosData, isLoading: loadGeneros } = useSWR<Genero[]>("/generos", fetcher);
  const { data: filmesData, isLoading: loadFilmes } = useSWR<Filme[]>("/filmes", fetcher);
  const { data: seriesData, isLoading: loadSeries } = useSWR<Serie[]>("/series", fetcher);

  const [generoSelecionado, setGeneroSelecionado] = useState<number | null>(null);

  const carregando = loadGeneros || loadFilmes || loadSeries;

  const generos = (generosData || []).sort((a, b) => a.nome.localeCompare(b.nome));

  // Seleciona o primeiro gênero por padrão assim que carregar
  if (generos.length > 0 && generoSelecionado === null) {
    setGeneroSelecionado(generos[0].id);
  }

  // Previne os erros do objeto paginado do Backend
  const filmesSeguros = Array.isArray(filmesData) ? filmesData : [];
  const seriesSeguras = Array.isArray(seriesData) ? seriesData : [];

  const filmes = filmesSeguros
    .filter((v, i, a) => a.findIndex(t => t.titulo === v.titulo) === i)
    .sort((a, b) => a.titulo.localeCompare(b.titulo));

  const series = seriesSeguras
    .filter((v, i, a) => a.findIndex(t => t.titulo === v.titulo) === i)
    .sort((a, b) => a.titulo.localeCompare(b.titulo));

  const filmesFiltrados = filmes.filter(filme => filme.generos?.some(g => g.id === generoSelecionado));
  const seriesFiltradas = series.filter(serie => serie.generos?.some(g => g.id === generoSelecionado));

  return (
    <PageWrapper hasNavbar={true}>
      <div className="w-full min-h-screen pt-24 px-6 md:px-12 pb-20">
        
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 flex items-center gap-3">
          <SearchCheck className="w-8 h-8 text-red-600" />
          Explorar por Gêneros
        </h2>

        {carregando ? (
          <p className="text-gray-400">Carregando categorias...</p>
        ) : generos.length === 0 ? (
          <p className="text-gray-500 italic bg-[#111111] p-6 rounded-xl border border-gray-800 text-center">
            Nenhum gênero cadastrado no sistema.
          </p>
        ) : (
          <>
            <div className="bg-[#111111] border border-gray-800 rounded-xl p-4 md:p-8 mb-12 shadow-lg">
              <div className="flex gap-4 overflow-x-auto pb-6 pt-2 px-2 custom-scrollbar">
                {generos.map((genero) => {
                  const isSelected = generoSelecionado === genero.id;
                  return (
                    <Badge
                      key={genero.id}
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => setGeneroSelecionado(genero.id)}
                      className={`cursor-pointer whitespace-nowrap px-6 py-3 text-base font-bold transition-all duration-300 ${
                        isSelected
                          ? "bg-red-600 hover:bg-red-700 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] border-transparent"
                          : "text-gray-400 border-gray-700 hover:border-gray-400 hover:text-white bg-transparent"
                      }`}
                    >
                      {genero.nome}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {filmesFiltrados.length > 0 && (
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2 border-b border-gray-800 pb-3">
                  <Film className="text-red-600 w-7 h-7" /> Filmes
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4 gap-y-8">
                  {filmesFiltrados.map((filme) => (
                    <CardConteudo key={filme.id} id={filme.id} titulo={filme.titulo} capaUrlMinio={filme.capaUrlMinio} planoMinimo={filme.planoMinimo} anoLancamento={filme.anoLancamento} mostrarDetalhes={true} />
                  ))}
                </div>
              </div>
            )}

            {seriesFiltradas.length > 0 && (
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2 border-b border-gray-800 pb-3">
                  <Clapperboard className="text-red-600 w-7 h-7" /> Séries
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4 gap-y-8">
                  {seriesFiltradas.map((serie) => (
                    <CardConteudo key={serie.id} id={serie.id} titulo={serie.titulo} capaUrlMinio={serie.capaUrlMinio} planoMinimo={serie.planoMinimo} anoLancamento={serie.anoLancamento} mostrarDetalhes={true} />
                  ))}
                </div>
              </div>
            )}

            {filmesFiltrados.length === 0 && seriesFiltradas.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 mt-8">
                <div className="w-24 h-24 bg-red-600/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Popcorn className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Poxa, que vazio!</h3>
                <p className="text-gray-400 text-center max-w-md">
                  Ainda não temos nenhum conteúdo cadastrado nesta categoria. Em breve o catálogo será atualizado!
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  );
}