"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { Filme, Serie, Genero } from "@/types/conteudo";
import PageWrapper from "@/components/PageWrapper";
import CardConteudo from "@/components/shared/CardConteudo";
import { Film, Clapperboard, SearchCheck, Popcorn } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function GenerosPage() {
  const [generos, setGeneros] = useState<Genero[]>([]);
  const [generoSelecionado, setGeneroSelecionado] = useState<number | null>(null);
  
  const [filmes, setFilmes] = useState<Filme[]>([]);
  const [series, setSeries] = useState<Serie[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const buscarDados = async () => {
      try {
        const [respGeneros, respFilmes, respSeries] = await Promise.all([
          api.get<Genero[]>("/generos"),
          api.get<Filme[]>("/filmes"),
          api.get<Serie[]>("/series")
        ]);
        
        const generosOrdenados = respGeneros.data.sort((a, b) => a.nome.localeCompare(b.nome));
        setGeneros(generosOrdenados);
        
        setFilmes(respFilmes.data.filter((v, i, a) => a.findIndex(t => t.titulo === v.titulo) === i).sort((a, b) => a.titulo.localeCompare(b.titulo)));
        setSeries(respSeries.data.filter((v, i, a) => a.findIndex(t => t.titulo === v.titulo) === i).sort((a, b) => a.titulo.localeCompare(b.titulo)));
        
        if (generosOrdenados.length > 0) {
          setGeneroSelecionado(generosOrdenados[0].id);
        }
      } catch (error) {
        console.error("Erro ao buscar dados", error);
      } finally {
        setCarregando(false);
      }
    };
    buscarDados();
  }, []);

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
            {/* TRILHO DE BOTÕES DE GÊNERO */}
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

            {/* SEÇÃO 1: FILMES */}
            {filmesFiltrados.length > 0 && (
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2 border-b border-gray-800 pb-3">
                  <Film className="text-red-600 w-7 h-7" /> Filmes
                </h3>
                {/* GRID PEQUENO E ESPREMIDO PARA CABER MUITOS FILMES */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4 gap-y-8">
                  {filmesFiltrados.map((filme) => (
                    <CardConteudo key={filme.id} id={filme.id} titulo={filme.titulo} capaUrlMinio={filme.capaUrlMinio} planoMinimo={filme.planoMinimo} anoLancamento={filme.anoLancamento} mostrarDetalhes={true} />
                  ))}
                </div>
              </div>
            )}

            {/* SEÇÃO 2: SÉRIES */}
            {seriesFiltradas.length > 0 && (
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2 border-b border-gray-800 pb-3">
                  <Clapperboard className="text-red-600 w-7 h-7" /> Séries
                </h3>
                {/* GRID PEQUENO E ESPREMIDO PARA CABER MUITAS SÉRIES */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4 gap-y-8">
                  {seriesFiltradas.map((serie) => (
                    <CardConteudo key={serie.id} id={serie.id} titulo={serie.titulo} capaUrlMinio={serie.capaUrlMinio} planoMinimo={serie.planoMinimo} anoLancamento={serie.anoLancamento} mostrarDetalhes={true} />
                  ))}
                </div>
              </div>
            )}

            {/* ESTADO VAZIO (NENHUM FILME OU SÉRIE NO GÊNERO ESCOLHIDO) */}
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