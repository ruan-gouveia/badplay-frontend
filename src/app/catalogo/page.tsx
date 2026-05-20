"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { Filme, Serie } from "@/types/conteudo";
import Navbar from "@/components/Navbar";
import PageWrapper from "@/components/PageWrapper";

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
          api.get<Filme[]>("/filmes"),
          api.get<Serie[]>("/series"),
          api.get<Historico[]>("/historico/meu-historico")
        ]);
        
        // Remove as duplicatas (caso tenha cadastrado o mesmo filme 2x no Postman)
        const filmesUnicos = respFilmes.data.filter((v, i, a) => a.findIndex(t => (t.titulo === v.titulo)) === i);
        const seriesUnicas = respSeries.data.filter((v, i, a) => a.findIndex(t => (t.titulo === v.titulo)) === i);
        const historicoUnico = respHistorico.data.filter((v, i, a) => a.findIndex(t => (t.conteudoTitulo === v.conteudoTitulo)) === i);

        setFilmes(filmesUnicos);
        setSeries(seriesUnicas);
        setHistorico(historicoUnico);
      } catch (error) { console.error(error); }
    };
    buscarDados();
  }, []);

  // FUNÇÃO NOVA: Deletar do Histórico
  const handleRemoverHistorico = async (idHistorico: number, e: React.MouseEvent) => {
    e.stopPropagation(); // MÁGICA: Impede que o clique no botão ative o clique do card (que abre o filme)
    try {
      await api.delete(`/historico/${idHistorico}`);
      // Remove da tela instantaneamente sem precisar recarregar a página
      setHistorico(historico.filter(h => h.id !== idHistorico));
    } catch (error) {
      console.error("Erro ao remover do histórico", error);
    }
  };

  const getUrlImagem = (nome: string) => nome ? `http://localhost:8080/api/arquivos/${nome}` : "https://via.placeholder.com/300x450?text=Sem+Capa";
  
  const renderBadge = (planoMinimo: string) => {
    const plano = planoMinimo || "BASICO";
    if (plano === "PREMIUM") return <span className="absolute top-2 right-2 bg-yellow-500 text-black text-[10px] font-extrabold px-2 py-1 rounded shadow-lg z-10">PREMIUM</span>;
    if (plano === "PADRAO") return <span className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] font-extrabold px-2 py-1 rounded shadow-lg z-10">PADRÃO</span>;
    return null; 
  };

  const renderBadgeTexto = (planoMinimo: string) => {
    const plano = planoMinimo || "BASICO";
    if (plano === "PREMIUM") return <span className="bg-yellow-500 text-black px-2 py-0.5 rounded text-xs font-bold">Plano PREMIUM</span>;
    if (plano === "PADRAO") return <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-bold">Plano PADRÃO</span>;
    return <span className="border border-gray-500 text-gray-300 px-2 py-0.5 rounded text-xs font-bold">Plano BÁSICO</span>;
  };

  const destaque = filmes.length > 0 ? filmes[0] : null;

  return (
    <PageWrapper>
      <Navbar />
      
      {/* Banner Principal */}
      {destaque && (
        <div className="relative w-full h-[75vh] md:h-[85vh] flex items-center">
          <div className="absolute inset-0 z-0">
            <img src={getUrlImagem(destaque.capaUrlMinio)} alt={destaque.titulo} className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/20 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/60 to-transparent"></div>
          </div>
          
          <div className="relative z-10 pl-6 md:pl-16 max-w-2xl mt-20">
            <h2 className="text-5xl md:text-7xl font-bold mb-4">{destaque.titulo}</h2>
            <div className="flex items-center gap-4 text-sm md:text-base font-semibold text-gray-300 mb-6">
              <span className="text-green-500 font-bold">98% Relevante</span>
              <span>{destaque.anoLancamento}</span>
              {renderBadgeTexto(destaque.planoMinimo)}
              <span>{destaque.duracaoMinutos} min</span>
            </div>
            <p className="text-lg text-gray-300 mb-8 line-clamp-3">{destaque.descricao}</p>
            <button onClick={() => router.push(`/conteudo/${destaque.id}`)} className="bg-white text-black font-bold py-3 px-10 rounded flex items-center justify-center hover:bg-gray-300 transition text-xl w-fit">
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
                <div key={hist.id} onClick={() => router.push(`/conteudo/${hist.conteudoId}`)} className="min-w-[240px] w-[240px] flex-none cursor-pointer group relative">
                  <div className="relative h-[140px] rounded-md overflow-hidden border border-gray-800">
                    <img src={getUrlImagem(hist.capaUrlMinio)} alt={hist.conteudoTitulo} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition" />
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-600">
                      <div className="h-full bg-red-600" style={{ width: `${Math.min((hist.tempoAssistidoSegundos / 3600) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm font-semibold truncate text-white">{hist.conteudoTitulo}</p>
                    
                    {/* BOTÃO DE EXCLUIR */}
                    <button 
                      onClick={(e) => handleRemoverHistorico(hist.id, e)}
                      className="text-gray-500 hover:text-red-500 transition-colors text-xl font-bold px-2 pb-1 opacity-0 group-hover:opacity-100"
                      title="Remover do histórico"
                    >
                      ×
                    </button>
                  </div>
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
                <div key={filme.id} onClick={() => router.push(`/conteudo/${filme.id}`)} className="relative min-w-[200px] w-[200px] flex-none cursor-pointer transition-transform hover:scale-105">
                  {renderBadge(filme.planoMinimo)}
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
                <div key={serie.id} onClick={() => router.push(`/conteudo/${serie.id}`)} className="relative min-w-[200px] w-[200px] flex-none cursor-pointer transition-transform hover:scale-105">
                  {renderBadge(serie.planoMinimo)}
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