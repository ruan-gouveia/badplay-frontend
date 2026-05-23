"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { Filme, Serie } from "@/types/conteudo";
import PageWrapper from "@/components/PageWrapper";
import CardConteudo from "@/components/shared/CardConteudo";
import BannerDestaque from "@/components/shared/BannerDestaque";
import { Play, X, StepForward, Film, Clapperboard } from "lucide-react"; // Adicionamos os ícones aqui

interface Historico { id: number; conteudoId: number; conteudoTitulo: string; capaUrlMinio: string; tempoAssistidoSegundos: number; }

export default function CatalogoPage() {
  const router = useRouter();
  const [filmes, setFilmes] = useState<Filme[]>([]);
  const [series, setSeries] = useState<Serie[]>([]);
  const [historico, setHistorico] = useState<Historico[]>([]);

  useEffect(() => {
    const buscarDados = async () => {
      try {
        const [respFilmes, respSeries, respHistorico] = await Promise.all([
          api.get<Filme[]>("/filmes"), api.get<Serie[]>("/series"), api.get<Historico[]>("/historico/meu-historico")
        ]);
        
        setFilmes(respFilmes.data.filter((v, i, a) => a.findIndex(t => t.titulo === v.titulo) === i));
        setSeries(respSeries.data.filter((v, i, a) => a.findIndex(t => t.titulo === v.titulo) === i));
        setHistorico(respHistorico.data.filter((v, i, a) => a.findIndex(t => t.conteudoTitulo === v.conteudoTitulo) === i));
      } catch (error) { console.error(error); }
    };
    buscarDados();
  }, []);

  const handleRemoverHistorico = async (idHistorico: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/historico/${idHistorico}`);
      setHistorico(historico.filter(h => h.id !== idHistorico));
    } catch (error) { console.error(error); }
  };

  const getUrlImagem = (nome: string) => nome ? `http://localhost:8080/api/arquivos/${nome}` : "https://via.placeholder.com/300x450?text=Sem+Capa";
  const destaque = filmes.length > 0 ? filmes[0] : null;

  return (
    <PageWrapper hasNavbar={true}>
      
      {destaque && <BannerDestaque destaque={destaque} />}

      <div className="relative z-20 pb-20 -mt-10 flex flex-col gap-12">
        
        {/* Histórico com Ícone StepForward */}
        {historico.length > 0 && (
          <div className="pl-6 md:pl-16">
            <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
              <StepForward className="w-7 h-7 text-red-600" /> Continuar Assistindo
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {historico.map((hist) => (
                <div key={hist.id} onClick={() => router.push(`/conteudo/${hist.conteudoId}`)} className="min-w-[240px] w-[240px] flex-none cursor-pointer group relative transition-transform duration-300 hover:scale-105">
                  <div className="relative h-[140px] rounded-md overflow-hidden border border-gray-800 bg-[#222] shadow-lg">
                    <img src={getUrlImagem(hist.capaUrlMinio)} alt={hist.conteudoTitulo} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition" />
                    
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/40">
                      <Play className="w-12 h-12 text-white border-2 border-white rounded-full p-2 bg-black/50 hover:bg-red-600 transition" />
                    </div>

                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-600">
                      <div className="h-full bg-red-600" style={{ width: `${Math.min((hist.tempoAssistidoSegundos / 3600) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-3 px-1">
                    <p className="text-sm font-semibold truncate text-white">{hist.conteudoTitulo}</p>
                    <button onClick={(e) => handleRemoverHistorico(hist.id, e)} className="text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100" title="Remover do histórico">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filmes com Ícone Film */}
        {filmes.length > 0 && (
          <div className="pl-6 md:pl-16">
            <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
              <Film className="w-7 h-7 text-red-600" /> Filmes
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {filmes.map((filme) => (
                <CardConteudo key={filme.id} id={filme.id} titulo={filme.titulo} capaUrlMinio={filme.capaUrlMinio} planoMinimo={filme.planoMinimo} mostrarDetalhes={false} className="min-w-[200px] w-[200px]" />
              ))}
            </div>
          </div>
        )}

        {/* Séries com Ícone Clapperboard */}
        {series.length > 0 && (
          <div className="pl-6 md:pl-16">
            <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
              <Clapperboard className="w-7 h-7 text-red-600" /> Séries
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {series.map((serie) => (
                <CardConteudo key={serie.id} id={serie.id} titulo={serie.titulo} capaUrlMinio={serie.capaUrlMinio} planoMinimo={serie.planoMinimo} mostrarDetalhes={false} className="min-w-[200px] w-[200px]" />
              ))}
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}