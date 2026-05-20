"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { Filme, Serie } from "@/types/conteudo";
import Navbar from "@/components/Navbar";
import PageWrapper from "@/components/PageWrapper";

interface Historico {
  id: number; conteudoId: number; conteudoTitulo: string; capaUrlMinio: string; tempoAssistidoSegundos: number;
}

export default function CatalogoPage() {
  const [filmes, setFilmes] = useState<Filme[]>([]);
  const [series, setSeries] = useState<Serie[]>([]);
  const [historico, setHistorico] = useState<Historico[]>([]);

  useEffect(() => {
    const buscarDados = async () => {
      try {
        const [respFilmes, respSeries, respHistorico] = await Promise.all([
          api.get<Filme[]>("/filmes"),
          api.get<Serie[]>("/series"),
          api.get<Historico[]>("/historico/meu-historico")
        ]);
        setFilmes(respFilmes.data);
        setSeries(respSeries.data);
        setHistorico(respHistorico.data);
      } catch (error) { console.error(error); }
    };
    buscarDados();
  }, []);

  const getUrlImagem = (nome: string) => nome ? `http://localhost:8080/api/arquivos/${nome}` : "https://via.placeholder.com/300x450?text=Sem+Capa";
  const destaque = filmes.length > 0 ? filmes[0] : null;

  return (
    <PageWrapper>
      <Navbar />
      
      {/* Banner Principal - Limpo e Arrumado! */}
      {destaque && (
        <div className="relative w-full h-[75vh] md:h-[85vh] flex items-center">
          <div className="absolute inset-0 z-0">
            <img src={getUrlImagem(destaque.capaUrlMinio)} alt={destaque.titulo} className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/20 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/60 to-transparent"></div>
          </div>
          
          <div className="relative z-10 pl-6 md:pl-16 max-w-2xl mt-20">
            <h2 className="text-5xl md:text-7xl font-bold mb-4">{destaque.titulo}</h2>
            
            {/* Informações no estilo Netflix */}
            <div className="flex items-center gap-4 text-sm md:text-base font-semibold text-gray-300 mb-6">
              <span className="text-green-500 font-bold">98% Relevante</span>
              <span>{destaque.anoLancamento}</span>
              <span className="border border-gray-500 px-1 rounded text-xs">{destaque.planoMinimo}</span>
              <span>{destaque.duracaoMinutos} min</span>
            </div>

            <p className="text-lg text-gray-300 mb-8 line-clamp-3">{destaque.descricao}</p>
            
            <button className="bg-white text-black font-bold py-3 px-10 rounded flex items-center justify-center hover:bg-gray-300 transition text-xl w-fit">
              Assistir
            </button>
          </div>
        </div>
      )}

      {/* Carrosséis */}
      <div className="relative z-20 pb-20 -mt-10 flex flex-col gap-10">
        
        {historico.length > 0 && (
          <div className="pl-6 md:pl-16">
            <h3 className="text-2xl font-semibold mb-4 text-white">Continuar Assistindo</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {historico.map((hist) => (
                <div key={hist.id} className="min-w-[240px] w-[240px] flex-none cursor-pointer group">
                  <div className="relative h-[140px] rounded-md overflow-hidden border border-gray-800">
                    <img src={getUrlImagem(hist.capaUrlMinio)} alt={hist.conteudoTitulo} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition" />
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-600">
                      <div className="h-full bg-red-600" style={{ width: `${Math.min((hist.tempoAssistidoSegundos / 3600) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                  <p className="text-sm font-semibold truncate mt-2 text-white">{hist.conteudoTitulo}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {filmes.length > 0 && (
          <div className="pl-6 md:pl-16">
            <h3 className="text-2xl font-semibold mb-4 text-white">Filmes</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {filmes.map((filme) => (
                <div key={filme.id} className="min-w-[200px] w-[200px] flex-none cursor-pointer transition-transform hover:scale-105">
                  <img src={getUrlImagem(filme.capaUrlMinio)} alt={filme.titulo} className="w-full h-[300px] object-cover rounded-md shadow-lg" />
                </div>
              ))}
            </div>
          </div>
        )}

        {series.length > 0 && (
          <div className="pl-6 md:pl-16">
            <h3 className="text-2xl font-semibold mb-4 text-white">Séries</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {series.map((serie) => (
                <div key={serie.id} className="min-w-[200px] w-[200px] flex-none cursor-pointer transition-transform hover:scale-105">
                  <img src={getUrlImagem(serie.capaUrlMinio)} alt={serie.titulo} className="w-full h-[300px] object-cover rounded-md shadow-lg" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}